/**
 * JDTLSClient - LSP client for Java/Kotlin using Eclipse JDT Language Server
 *
 * JDT LS is a fully-featured Java language server that supports
 * code completion, diagnostics, refactoring, and more.
 */
import * as fs from "fs";
import { BaseLSPClient } from "../BaseLSPClient.js";
import { JDTLSInstaller } from "../installers/JDTLSInstaller.js";
export class JDTLSClient extends BaseLSPClient {
    language = "java";
    installer;
    constructor(workspaceRoot) {
        super(workspaceRoot, "java");
        this.installer = new JDTLSInstaller();
    }
    /**
     * Get the command to start JDT LS
     */
    getStartCommand() {
        // This will be called after installation, so we can get the command synchronously
        // by using a cached version or throwing if not installed
        const launcherJar = this.findLauncherJar();
        if (!launcherJar) {
            throw new Error("JDT LS not installed");
        }
        const installDir = this.installer.getInstallDir();
        const configDir = this.getConfigDir(installDir);
        const dataDir = `${installDir}/data`;
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
     * Find the equinox launcher JAR
     */
    findLauncherJar() {
        const installDir = this.installer.getInstallDir();
        const pluginsDir = `${installDir}/plugins`;
        try {
            if (!fs.existsSync(pluginsDir)) {
                return null;
            }
            const files = fs.readdirSync(pluginsDir);
            const launcher = files.find((f) => f.startsWith("org.eclipse.equinox.launcher_") && f.endsWith(".jar"));
            if (launcher) {
                return `${pluginsDir}/${launcher}`;
            }
        }
        catch {
            return null;
        }
        return null;
    }
    /**
     * Get the config directory based on OS
     */
    getConfigDir(installDir) {
        const platform = process.platform;
        if (platform === "darwin") {
            return `${installDir}/config_mac`;
        }
        else if (platform === "win32") {
            return `${installDir}/config_win`;
        }
        else {
            return `${installDir}/config_linux`;
        }
    }
    /**
     * Get initialization options for JDT LS
     */
    getInitializationOptions() {
        return {
            bundles: [],
            workspaceFolders: [`file://${this.workspaceRoot}`],
            settings: {
                java: {
                    home: process.env.JAVA_HOME || null,
                    configuration: {
                        updateBuildConfiguration: "automatic",
                    },
                    import: {
                        gradle: {
                            enabled: true,
                        },
                        maven: {
                            enabled: true,
                        },
                    },
                    autobuild: {
                        enabled: true,
                    },
                    completion: {
                        enabled: true,
                        overwrite: true,
                        guessMethodArguments: true,
                    },
                    format: {
                        enabled: true,
                    },
                    saveActions: {
                        organizeImports: false,
                    },
                    signatureHelp: {
                        enabled: true,
                    },
                },
            },
            extendedClientCapabilities: {
                classFileContentsSupport: true,
                overrideMethodsPromptSupport: true,
                hashCodeEqualsPromptSupport: true,
                advancedOrganizeImportsSupport: true,
                generateToStringPromptSupport: true,
                advancedGenerateAccessorsSupport: true,
                generateConstructorsPromptSupport: true,
                generateDelegateMethodsPromptSupport: true,
                advancedExtractRefactoringSupport: true,
                moveRefactoringSupport: true,
                clientHoverProvider: true,
                clientDocumentSymbolProvider: true,
                gradleChecksumWrapperPromptSupport: true,
                resolveAdditionalTextEditsSupport: true,
                advancedIntroduceParameterRefactoringSupport: true,
                actionableRuntimeNotificationSupport: true,
                shouldLanguageServerExitOnShutdown: true,
            },
        };
    }
    /**
     * Override to get language ID for Java/Kotlin files
     */
    getLanguageId(filePath) {
        const ext = filePath.split(".").pop()?.toLowerCase() || "";
        if (ext === "kt" || ext === "kts") {
            return "kotlin";
        }
        return "java";
    }
}
