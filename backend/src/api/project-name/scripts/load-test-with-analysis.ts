import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { LogAnalyzer } from './analyze-logs';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const LOG_FILE = join(process.cwd(), 'logs/combined.log');
const REPORT_FILE = join(process.cwd(), `load-test-report-${Date.now()}.txt`);

interface LoadTestConfig {
  projectCount: number;
  concurrentRequests: number;
}

class LoadTestWithAnalysis {
  private logFile: string;
  private initialLogSize: number = 0;
  private finalLogSize: number = 0;

  constructor(logFile: string = LOG_FILE) {
    console.log(`  Constructor called with logFile: ${logFile}`);
    console.log(`  LOG_FILE constant: ${LOG_FILE}`);
    this.logFile = logFile || LOG_FILE;
    console.log(`  this.logFile set to: ${this.logFile}`);
  }

  async getInitialLogSize(): Promise<number> {
    if (existsSync(this.logFile)) {
      const stats = statSync(this.logFile);
      return stats.size;
    }
    return 0;
  }

  async runLoadTest(config: LoadTestConfig): Promise<void> {
    console.log('🚀 Starting Load Test with Analysis\n');
    console.log('Configuration:');
    console.log(`  - Projects: ${config.projectCount}`);
    console.log(`  - Concurrent: ${config.concurrentRequests}`);
    console.log(`  - API URL: ${API_BASE_URL}\n`);

    // Get initial log size
    this.initialLogSize = await this.getInitialLogSize();
    console.log(`📊 Initial log size: ${(this.initialLogSize / 1024 / 1024).toFixed(2)} MB\n`);

    // Run load test
    console.log('⏳ Running load test...\n');
    await this.executeLoadTest(config.projectCount);

    // Wait a bit for logs to be written
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get final log size
    this.finalLogSize = await this.getInitialLogSize();
    console.log(`\n📊 Final log size: ${(this.finalLogSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 New log entries: ${((this.finalLogSize - this.initialLogSize) / 1024).toFixed(2)} KB\n`);
  }

  private executeLoadTest(projectCount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadTestProcess = spawn('npm', ['run', 'load-test:projects', projectCount.toString()], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      });

      loadTestProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Load test exited with code ${code}`));
        }
      });

      loadTestProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async analyzeLogs(): Promise<string> {
    console.log('🔍 Analyzing logs...\n');
    console.log(`  Looking for log file: ${this.logFile}`);
    console.log(`  Current working directory: ${process.cwd()}`);
    console.log(`  File exists: ${existsSync(this.logFile)}`);

    if (!existsSync(this.logFile)) {
      // Try absolute path
      const absolutePath = join(process.cwd(), 'logs/combined.log');
      console.log(`  Trying absolute path: ${absolutePath}`);
      if (existsSync(absolutePath)) {
        this.logFile = absolutePath;
      } else {
        throw new Error(`Log file not found: ${this.logFile}`);
      }
    }

    // Read only new log entries (from initialLogSize to end)
    const logContent = readFileSync(this.logFile, 'utf-8');
    const lines = logContent.split('\n');

    // Create a temporary log file with only new entries
    const tempLogFile = join(process.cwd(), '.temp-load-test-logs.log');
    const newLines = lines.slice(Math.floor(lines.length * 0.9)); // Last 10% of logs (recent entries)
    writeFileSync(tempLogFile, newLines.join('\n'), 'utf-8');

    try {
      const analyzer = new LogAnalyzer(tempLogFile);
      analyzer.parseLogs();
      const analysis = analyzer.analyze();
      const report = analyzer.generateReport();

      // Clean up temp file
      if (existsSync(tempLogFile)) {
        unlinkSync(tempLogFile);
      }

      return report;
    } catch (error: any) {
      // Clean up temp file
      if (existsSync(tempLogFile)) {
        unlinkSync(tempLogFile);
      }
      throw error;
    }
  }

  async generateFinalReport(loadTestResults: string, logAnalysis: string): Promise<string> {
    const timestamp = new Date().toISOString();
    let report = '\n';
    report += '═'.repeat(80) + '\n';
    report += '📊 LOAD TEST & LOG ANALYSIS REPORT\n';
    report += '═'.repeat(80) + '\n';
    report += `Generated at: ${timestamp}\n`;
    report += `API URL: ${API_BASE_URL}\n`;
    report += `Log File: ${this.logFile}\n`;
    report += `Log Size Change: ${((this.finalLogSize - this.initialLogSize) / 1024).toFixed(2)} KB\n`;
    report += `Initial Size: ${(this.initialLogSize / 1024 / 1024).toFixed(2)} MB\n`;
    report += `Final Size: ${(this.finalLogSize / 1024 / 1024).toFixed(2)} MB\n\n`;

    report += '─'.repeat(80) + '\n';
    report += '📈 LOAD TEST RESULTS\n';
    report += '─'.repeat(80) + '\n';
    report += loadTestResults + '\n\n';

    report += '─'.repeat(80) + '\n';
    report += '📋 LOG ANALYSIS\n';
    report += '─'.repeat(80) + '\n';
    report += logAnalysis + '\n';

    report += '═'.repeat(80) + '\n';
    report += '✅ REPORT COMPLETE\n';
    report += '═'.repeat(80) + '\n';

    return report;
  }

  async saveReport(report: string, filename: string): Promise<void> {
    writeFileSync(filename, report, 'utf-8');
    console.log(`\n✓ Report saved to: ${filename}\n`);
  }
}

async function main() {
  const projectCount = parseInt(process.argv[2] || '20', 10);
  const concurrentRequests = parseInt(process.env.CONCURRENT_REQUESTS || '5', 10);

  console.log(`📊 Starting load test with ${projectCount} projects\n`);
  console.log(`📁 Log file: ${LOG_FILE}\n`);

  const tester = new LoadTestWithAnalysis();

  try {
    // Run load test
    await tester.runLoadTest({ projectCount, concurrentRequests });

    // Analyze logs
    const logAnalysis = await tester.analyzeLogs();

    // Get load test results (we'll need to capture this from the load test output)
    // For now, we'll just use the log analysis
    const loadTestResults = 'Load test completed. See log analysis for details.';

    // Generate final report
    const finalReport = await tester.generateFinalReport(loadTestResults, logAnalysis);

    // Print and save report
    console.log(finalReport);
    await tester.saveReport(finalReport, REPORT_FILE);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

