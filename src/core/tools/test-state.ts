import * as fs from 'fs';
import * as path from 'path';

export interface TestRunState {
  language: 'python' | 'java';
  timestamp: number;
  testCounts: {
    total: number;
    passed: number;
    failed: number;
  };
  coverage?: {
    line: number;
    branch: number;
    instruction?: number;
  };
  testFiles: string[];
  projectPath?: string;
  commitHash?: string;
}

export interface TestHistory {
  runs: TestRunState[];
  lastReportGeneration?: number;
}

export class TestStateManager {
  private stateDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.stateDir = path.join(projectRoot, '.codecli', 'test-state');
    this.ensureStateDir();
  }

  private ensureStateDir(): void {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  private getStateFile(language: 'python' | 'java', projectPath?: string): string {
    const filename = projectPath
      ? `${language}-${projectPath.replace(/\//g, '-')}-history.json`
      : `${language}-history.json`;
    return path.join(this.stateDir, filename);
  }

  public getHistory(language: 'python' | 'java', projectPath?: string): TestHistory {
    const file = this.getStateFile(language, projectPath);
    if (!fs.existsSync(file)) {
      return { runs: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return { runs: [] };
    }
  }

  public saveRun(state: TestRunState): void {
    const history = this.getHistory(state.language, state.projectPath);
    history.runs.push(state);

    // Keep last 50 runs to prevent unbounded growth
    if (history.runs.length > 50) {
      history.runs = history.runs.slice(-50);
    }

    fs.writeFileSync(
      this.getStateFile(state.language, state.projectPath),
      JSON.stringify(history, null, 2),
      'utf-8'
    );
  }

  public getLastRun(language: 'python' | 'java', projectPath?: string): TestRunState | null {
    const history = this.getHistory(language, projectPath);
    return history.runs.length > 0 ? history.runs[history.runs.length - 1] : null;
  }

  public compareRuns(current: TestRunState, previous: TestRunState | null): {
    testCountChanged: boolean;
    testCountDelta: number;
    testsRemoved: boolean;
    coverageChanged: boolean;
    coverageDelta?: { line: number; branch: number };
    warnings: string[];
  } {
    const warnings: string[] = [];

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
      warnings.push(
        `⚠️  WARNING: ${Math.abs(testCountDelta)} test(s) REMOVED ` +
        `(was ${previous.testCounts.total}, now ${current.testCounts.total})`
      );
    } else if (testCountDelta > 0) {
      warnings.push(
        `✓ ${testCountDelta} new test(s) added ` +
        `(was ${previous.testCounts.total}, now ${current.testCounts.total})`
      );
    }

    let coverageChanged = false;
    let coverageDelta: { line: number; branch: number } | undefined;

    if (current.coverage && previous.coverage) {
      const lineDelta = current.coverage.line - previous.coverage.line;
      const branchDelta = current.coverage.branch - previous.coverage.branch;

      if (Math.abs(lineDelta) > 0.5 || Math.abs(branchDelta) > 0.5) {
        coverageChanged = true;
        coverageDelta = { line: lineDelta, branch: branchDelta };

        if (lineDelta < -1) {
          warnings.push(
            `⚠️  WARNING: Line coverage decreased by ${Math.abs(lineDelta).toFixed(1)}%`
          );
        }
        if (branchDelta < -1) {
          warnings.push(
            `⚠️  WARNING: Branch coverage decreased by ${Math.abs(branchDelta).toFixed(1)}%`
          );
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
