/**
 * JDTLSInstaller - Auto-install Eclipse JDT Language Server for Java/Kotlin
 *
 * Downloads JDT LS from Eclipse with integrity verification.
 * Uses Node.js https module instead of shell commands for security.
 */
import { execSync, spawn } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as https from "https";
import * as os from "os";
import * as path from "path";
import { withRetry, RetryConfigs, isTransientError } from "../utils/retry.js";
// Version configuration - can be overridden via environment variables
const DEFAULT_VERSION = "1.31.0";
const DEFAULT_TIMESTAMP = "202312211634";
// SHA256 checksums for known versions (from Eclipse's official releases)
// These should be verified against Eclipse's published checksums
const VERSION_CHECKSUMS = {
    "1.31.0-202312211634": "e8d5322b5b8c6a3f9e3f3f9e3f9e3f9e3f9e3f9e3f9e3f9e3f9e3f9e3f9e3f9e", // Placeholder - replace with actual
};
export class JDTLSInstaller {
    language = "java";
    jdtLsDir;
    version;
    timestamp;
    progressCallback;
    cancellationToken;
    constructor(options) {
        this.jdtLsDir = path.join(os.homedir(), ".codecli", "jdt-ls");
        this.version = options?.version || process.env.JDTLS_VERSION || DEFAULT_VERSION;
        this.timestamp = options?.timestamp || process.env.JDTLS_TIMESTAMP || DEFAULT_TIMESTAMP;
        this.progressCallback = options?.progressCallback;
        this.cancellationToken = options?.cancellationToken;
    }
    /**
     * Check if JDT LS is installed
     */
    async isInstalled() {
        try {
            const launcherJar = this.findLauncherJar();
            return launcherJar !== null;
        }
        catch {
            return false;
        }
    }
    /**
     * Find the equinox launcher JAR
     */
    findLauncherJar() {
        const pluginsDir = path.join(this.jdtLsDir, "plugins");
        if (!fs.existsSync(pluginsDir)) {
            return null;
        }
        try {
            const files = fs.readdirSync(pluginsDir);
            const launcher = files.find((f) => f.startsWith("org.eclipse.equinox.launcher_") && f.endsWith(".jar"));
            if (launcher) {
                return path.join(pluginsDir, launcher);
            }
        }
        catch {
            return null;
        }
        return null;
    }
    /**
     * Download a file using Node.js https module with progress tracking
     */
    async downloadFile(url, destPath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath);
            let bytesDownloaded = 0;
            const request = https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        reject(new Error("Redirect without location header"));
                        return;
                    }
                    file.close();
                    fs.unlinkSync(destPath);
                    this.downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
                    return;
                }
                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed with status ${response.statusCode}`));
                    return;
                }
                const totalBytes = response.headers["content-length"]
                    ? parseInt(response.headers["content-length"], 10)
                    : null;
                response.on("data", (chunk) => {
                    // Check for cancellation
                    if (this.cancellationToken?.cancelled) {
                        request.destroy();
                        file.close();
                        fs.unlinkSync(destPath);
                        reject(new Error("Download cancelled"));
                        return;
                    }
                    bytesDownloaded += chunk.length;
                    // Report progress
                    if (this.progressCallback) {
                        this.progressCallback({
                            bytesDownloaded,
                            totalBytes,
                            percentage: totalBytes ? Math.round((bytesDownloaded / totalBytes) * 100) : null,
                        });
                    }
                });
                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    resolve();
                });
            });
            request.on("error", (error) => {
                file.close();
                try {
                    fs.unlinkSync(destPath);
                }
                catch {
                    // Ignore cleanup errors
                }
                reject(error);
            });
            // Set timeout
            request.setTimeout(180000, () => {
                request.destroy();
                reject(new Error("Download timed out"));
            });
        });
    }
    /**
     * Verify file integrity using SHA256 checksum
     */
    async verifyChecksum(filePath, expectedHash) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash("sha256");
            const stream = fs.createReadStream(filePath);
            stream.on("data", (data) => hash.update(data));
            stream.on("end", () => {
                const actualHash = hash.digest("hex");
                resolve(actualHash.toLowerCase() === expectedHash.toLowerCase());
            });
            stream.on("error", reject);
        });
    }
    /**
     * Extract tar.gz file using spawn (safer than execSync with shell)
     */
    async extractTarGz(tarPath, destDir) {
        return new Promise((resolve, reject) => {
            const tar = spawn("tar", ["xzf", tarPath, "-C", destDir], {
                stdio: "pipe",
            });
            tar.on("close", (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`tar extraction failed with code ${code}`));
                }
            });
            tar.on("error", reject);
        });
    }
    /**
     * Install JDT LS by downloading from Eclipse with integrity verification
     */
    async install() {
        console.log("Installing Eclipse JDT Language Server...");
        // First check if Java is available
        try {
            execSync("java -version", { stdio: "pipe" });
        }
        catch {
            throw new Error("Java runtime not found. Please install Java 17+ to use Java LSP support.\n" +
                "Install with: brew install openjdk@17");
        }
        // Create directories
        fs.mkdirSync(this.jdtLsDir, { recursive: true });
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jdtls-"));
        const tarPath = path.join(tempDir, "jdt-ls.tar.gz");
        const url = `https://download.eclipse.org/jdtls/milestones/${this.version}/jdt-language-server-${this.version}-${this.timestamp}.tar.gz`;
        const versionKey = `${this.version}-${this.timestamp}`;
        console.log(`Downloading JDT LS ${this.version}...`);
        try {
            // Download to temp file with retry for transient errors
            await withRetry(() => this.downloadFile(url, tarPath), {
                ...RetryConfigs.installation,
                isRetryable: isTransientError,
            });
            // Verify checksum if available
            const expectedChecksum = VERSION_CHECKSUMS[versionKey];
            if (expectedChecksum) {
                console.log("Verifying download integrity...");
                const isValid = await this.verifyChecksum(tarPath, expectedChecksum);
                if (!isValid) {
                    throw new Error("Checksum verification failed. The downloaded file may be corrupted or tampered with.");
                }
                console.log("Checksum verified successfully.");
            }
            else {
                console.warn(`Warning: No checksum available for version ${versionKey}. Skipping integrity verification.`);
            }
            // Extract to installation directory
            console.log("Extracting...");
            await this.extractTarGz(tarPath, this.jdtLsDir);
            console.log("Eclipse JDT Language Server installed successfully.");
        }
        catch (error) {
            // Clean up on failure
            try {
                fs.rmSync(this.jdtLsDir, { recursive: true, force: true });
            }
            catch {
                // Ignore cleanup errors
            }
            throw new Error(`Failed to install JDT LS: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            // Clean up temp directory
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Get the command to start JDT LS
     */
    async getServerCommand() {
        const launcherJar = this.findLauncherJar();
        if (!launcherJar) {
            throw new Error("JDT LS launcher not found. Try reinstalling.");
        }
        // Determine config path based on OS
        let configDir;
        const platform = os.platform();
        if (platform === "darwin") {
            configDir = path.join(this.jdtLsDir, "config_mac");
        }
        else if (platform === "win32") {
            configDir = path.join(this.jdtLsDir, "config_win");
        }
        else {
            configDir = path.join(this.jdtLsDir, "config_linux");
        }
        // Data directory for workspace
        const dataDir = path.join(this.jdtLsDir, "data");
        fs.mkdirSync(dataDir, { recursive: true });
        return [
            "java",
            "-Declipse.application=org.eclipse.jdt.ls.core.id1",
            "-Dosgi.bundles.defaultStartLevel=4",
            "-Declipse.product=org.eclipse.jdt.ls.core.product",
            "-Dlog.level=ALL",
            "-Xmx1G",
            "--add-modules=ALL-SYSTEM",
            "--add-opens",
            "java.base/java.util=ALL-UNNAMED",
            "--add-opens",
            "java.base/java.lang=ALL-UNNAMED",
            "-jar",
            launcherJar,
            "-configuration",
            configDir,
            "-data",
            dataDir,
        ];
    }
    /**
     * Get the JDT LS installation directory
     */
    getInstallDir() {
        return this.jdtLsDir;
    }
    /**
     * Get the current version being used
     */
    getVersion() {
        return this.version;
    }
}
