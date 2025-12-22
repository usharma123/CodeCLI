import * as fs from 'fs';
import * as path from 'path';
export class TestStateManager {
    stateDir;
    constructor(projectRoot = process.cwd()) {
        this.stateDir = path.join(projectRoot, '.codecli', 'test-state');
        this.ensureStateDir();
    }
    ensureStateDir() {
        if (!fs.existsSync(this.stateDir)) {
            fs.mkdirSync(this.stateDir, { recursive: true });
        }
    }
    getStateFile(language, projectPath) {
        const filename = projectPath
            ? `${language}-${projectPath.replace(/\//g, '-')}-history.json`
            : `${language}-history.json`;
        return path.join(this.stateDir, filename);
    }
    getHistory(language, projectPath) {
        const file = this.getStateFile(language, projectPath);
        if (!fs.existsSync(file)) {
            return { runs: [] };
        }
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        }
        catch {
            return { runs: [] };
        }
    }
    saveRun(state) {
        const history = this.getHistory(state.language, state.projectPath);
        history.runs.push(state);
        // Keep last 50 runs to prevent unbounded growth
        if (history.runs.length > 50) {
            history.runs = history.runs.slice(-50);
        }
        fs.writeFileSync(this.getStateFile(state.language, state.projectPath), JSON.stringify(history, null, 2), 'utf-8');
    }
    getLastRun(language, projectPath) {
        const history = this.getHistory(language, projectPath);
        return history.runs.length > 0 ? history.runs[history.runs.length - 1] : null;
    }
    compareRuns(current, previous) {
        const warnings = [];
        if (!previous) {
            return {
                testCountChanged: false,
                testCountDelta: 0,
                testsRemoved: false,
                coverageChanged: false,
                warnings: ['First test run - no previous data to compare']
            };
        }
        const testCountDelta = current.testCounts.total - previous.testCounts.total;
        const testCountChanged = testCountDelta !== 0;
        const testsRemoved = testCountDelta < 0;
        if (testsRemoved) {
            warnings.push(`⚠️  WARNING: ${Math.abs(testCountDelta)} test(s) REMOVED ` +
                `(was ${previous.testCounts.total}, now ${current.testCounts.total})`);
        }
        else if (testCountDelta > 0) {
            warnings.push(`✓ ${testCountDelta} new test(s) added ` +
                `(was ${previous.testCounts.total}, now ${current.testCounts.total})`);
        }
        let coverageChanged = false;
        let coverageDelta;
        if (current.coverage && previous.coverage) {
            const lineDelta = current.coverage.line - previous.coverage.line;
            const branchDelta = current.coverage.branch - previous.coverage.branch;
            if (Math.abs(lineDelta) > 0.5 || Math.abs(branchDelta) > 0.5) {
                coverageChanged = true;
                coverageDelta = { line: lineDelta, branch: branchDelta };
                if (lineDelta < -1) {
                    warnings.push(`⚠️  WARNING: Line coverage decreased by ${Math.abs(lineDelta).toFixed(1)}%`);
                }
                if (branchDelta < -1) {
                    warnings.push(`⚠️  WARNING: Branch coverage decreased by ${Math.abs(branchDelta).toFixed(1)}%`);
                }
            }
        }
        return {
            testCountChanged,
            testCountDelta,
            testsRemoved,
            coverageChanged,
            coverageDelta,
            warnings
        };
    }
}
