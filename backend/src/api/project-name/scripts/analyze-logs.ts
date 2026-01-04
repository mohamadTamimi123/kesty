import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  error?: string;
  statusCode?: number;
  method?: string;
  url?: string;
  duration?: number;
}

interface LogAnalysis {
  totalEntries: number;
  errors: LogEntry[];
  warnings: LogEntry[];
  slowRequests: LogEntry[];
  statusCodes: Map<number, number>;
  endpoints: Map<string, { count: number; avgDuration: number; errors: number }>;
  timeRange: { start: string; end: string };
  errorRate: number;
  averageResponseTime: number;
  peakErrors: { time: string; count: number }[];
}

export class LogAnalyzer {
  private logFile: string;
  private logEntries: LogEntry[] = [];
  private analysis: LogAnalysis | null = null;

  constructor(logFile: string = 'logs/combined.log') {
    this.logFile = join(process.cwd(), logFile);
  }

  parseLogs(): void {
    if (!existsSync(this.logFile)) {
      throw new Error(`Log file not found: ${this.logFile}`);
    }

    console.log(`📖 Reading log file: ${this.logFile}`);
    const logContent = readFileSync(this.logFile, 'utf-8');
    const lines = logContent.split('\n').filter((line) => line.trim());

    console.log(`  Found ${lines.length} log lines\n`);

    for (const line of lines) {
      try {
        const entry = this.parseLogLine(line);
        if (entry) {
          this.logEntries.push(entry);
        }
      } catch (error) {
        // Skip unparseable lines
      }
    }

    console.log(`✓ Parsed ${this.logEntries.length} log entries\n`);
  }

  private parseLogLine(line: string): LogEntry | null {
    // Skip ANSI color codes
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');

    // Try to parse NestJS log format: [timestamp] [level] [context] message
    const nestjsPattern = /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(\w+)\] \[([^\]]+)\] (.+)/;
    const match = cleanLine.match(nestjsPattern);

    if (match) {
      const [, timestamp, level, context, message] = match;
      const entry: LogEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        context,
      };

      // Try to extract HTTP request info
      const httpMatch = message.match(/(\w+)\s+(\S+)\s+(\d+)\s+(\d+)ms/);
      if (httpMatch) {
        const [, method, url, statusCode, duration] = httpMatch;
        entry.method = method;
        entry.url = url;
        entry.statusCode = parseInt(statusCode, 10);
        entry.duration = parseInt(duration, 10);
      }

      // Try to extract error info
      if (level === 'ERROR' || message.includes('Error') || message.includes('Exception')) {
        entry.error = message;
      }

      return entry;
    }

    // Try to parse TypeORM query format: YYYY-MM-DDTHH:mm:ss: query: SELECT...
    const typeormPattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}):\s+query:\s+(.+)/;
    const typeormMatch = cleanLine.match(typeormPattern);
    if (typeormMatch) {
      const [, timestamp, query] = typeormMatch;
      return {
        timestamp,
        level: 'INFO',
        message: query.substring(0, 200), // Truncate long queries
        context: 'TypeORM',
      };
    }

    // Try to parse TypeORM error format
    const typeormErrorPattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}):\s+error:\s+(.+)/;
    const typeormErrorMatch = cleanLine.match(typeormErrorPattern);
    if (typeormErrorMatch) {
      const [, timestamp, error] = typeormErrorMatch;
      return {
        timestamp,
        level: 'ERROR',
        message: error,
        context: 'TypeORM',
        error: error,
      };
    }

    // Try to parse JSON format
    try {
      const json = JSON.parse(line);
      return {
        timestamp: json.timestamp || json.time || new Date().toISOString(),
        level: json.level || json.severity || 'INFO',
        message: json.message || json.msg || line,
        context: json.context || json.service,
        error: json.error || json.err,
        statusCode: json.statusCode || json.status,
        method: json.method,
        url: json.url || json.path,
        duration: json.duration || json.responseTime,
      };
    } catch {
      // Try simple format: timestamp level message
      const simplePattern = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?)\s+(\w+)\s+(.+)/;
      const simpleMatch = line.match(simplePattern);
      if (simpleMatch) {
        return {
          timestamp: simpleMatch[1],
          level: simpleMatch[2].toUpperCase(),
          message: simpleMatch[3],
        };
      }
    }

    return null;
  }

  analyze(): LogAnalysis {
    if (this.logEntries.length === 0) {
      throw new Error('No log entries to analyze. Parse logs first.');
    }

    console.log('🔍 Analyzing logs...\n');

    const errors: LogEntry[] = [];
    const warnings: LogEntry[] = [];
    const slowRequests: LogEntry[] = [];
    const statusCodes = new Map<number, number>();
    const endpoints = new Map<string, { count: number; totalDuration: number; errors: number }>();
    const errorTimestamps: string[] = [];

    let totalDuration = 0;
    let requestCount = 0;

    for (const entry of this.logEntries) {
      // Categorize by level
      if (entry.level === 'ERROR') {
        errors.push(entry);
        if (entry.timestamp) {
          errorTimestamps.push(entry.timestamp);
        }
      } else if (entry.level === 'WARN' || entry.level === 'WARNING') {
        warnings.push(entry);
      }

      // Track status codes
      if (entry.statusCode) {
        statusCodes.set(entry.statusCode, (statusCodes.get(entry.statusCode) || 0) + 1);
      }

      // Track endpoints
      if (entry.url && entry.method) {
        const key = `${entry.method} ${entry.url}`;
        const existing = endpoints.get(key) || { count: 0, totalDuration: 0, errors: 0 };
        existing.count++;
        if (entry.duration) {
          existing.totalDuration += entry.duration;
          totalDuration += entry.duration;
          requestCount++;
        }
        if (entry.statusCode && entry.statusCode >= 400) {
          existing.errors++;
        }
        endpoints.set(key, existing);
      }

      // Track slow requests (>1000ms)
      if (entry.duration && entry.duration > 1000) {
        slowRequests.push(entry);
      }
    }

    // Calculate peak error times
    const errorPeaks = this.calculateErrorPeaks(errorTimestamps);

    // Calculate average response time
    const averageResponseTime = requestCount > 0 ? totalDuration / requestCount : 0;

    // Calculate error rate
    const errorRate = this.logEntries.length > 0 ? (errors.length / this.logEntries.length) * 100 : 0;

    // Get time range
    const timestamps = this.logEntries.map((e) => e.timestamp).filter(Boolean).sort();
    const timeRange = {
      start: timestamps[0] || 'N/A',
      end: timestamps[timestamps.length - 1] || 'N/A',
    };

    // Convert endpoints map to include average duration
    const endpointStats = new Map<string, { count: number; avgDuration: number; errors: number }>();
    for (const [key, value] of endpoints.entries()) {
      endpointStats.set(key, {
        count: value.count,
        avgDuration: value.count > 0 ? value.totalDuration / value.count : 0,
        errors: value.errors,
      });
    }

    this.analysis = {
      totalEntries: this.logEntries.length,
      errors,
      warnings,
      slowRequests,
      statusCodes,
      endpoints: endpointStats,
      timeRange,
      errorRate,
      averageResponseTime,
      peakErrors: errorPeaks,
    };

    return this.analysis;
  }

  private calculateErrorPeaks(timestamps: string[]): { time: string; count: number }[] {
    const peaks: Map<string, number> = new Map();

    for (const timestamp of timestamps) {
      // Group by minute
      const minute = timestamp.substring(0, 16); // YYYY-MM-DD HH:MM
      peaks.set(minute, (peaks.get(minute) || 0) + 1);
    }

    return Array.from(peaks.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  generateReport(): string {
    if (!this.analysis) {
      throw new Error('No analysis available. Run analyze() first.');
    }

    const analysis = this.analysis;
    let report = '\n';
    report += '='.repeat(80) + '\n';
    report += '📊 LOG ANALYSIS REPORT\n';
    report += '='.repeat(80) + '\n\n';

    // Summary
    report += '📈 SUMMARY\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Log Entries: ${analysis.totalEntries.toLocaleString()}\n`;
    report += `Time Range: ${analysis.timeRange.start} → ${analysis.timeRange.end}\n`;
    report += `Error Rate: ${analysis.errorRate.toFixed(2)}%\n`;
    report += `Average Response Time: ${analysis.averageResponseTime.toFixed(0)}ms\n`;
    report += `Total Errors: ${analysis.errors.length}\n`;
    report += `Total Warnings: ${analysis.warnings.length}\n`;
    report += `Slow Requests (>1000ms): ${analysis.slowRequests.length}\n\n`;

    // Status Codes
    if (analysis.statusCodes.size > 0) {
      report += '📊 STATUS CODES\n';
      report += '-'.repeat(80) + '\n';
      const sortedStatusCodes = Array.from(analysis.statusCodes.entries()).sort((a, b) => b[1] - a[1]);
      for (const [code, count] of sortedStatusCodes) {
        const percentage = ((count / analysis.totalEntries) * 100).toFixed(2);
        const bar = '█'.repeat(Math.floor((count / analysis.totalEntries) * 50));
        report += `  ${code.toString().padEnd(4)}: ${count.toString().padStart(6)} (${percentage.padStart(5)}%) ${bar}\n`;
      }
      report += '\n';
    }

    // Top Endpoints
    if (analysis.endpoints.size > 0) {
      report += '🔗 TOP ENDPOINTS (by request count)\n';
      report += '-'.repeat(80) + '\n';
      const sortedEndpoints = Array.from(analysis.endpoints.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20);
      for (const [endpoint, stats] of sortedEndpoints) {
        report += `  ${endpoint.padEnd(50)} `;
        report += `Count: ${stats.count.toString().padStart(5)} `;
        report += `Avg: ${stats.avgDuration.toFixed(0)}ms `;
        report += `Errors: ${stats.errors}\n`;
      }
      report += '\n';
    }

    // Slowest Endpoints
    if (analysis.endpoints.size > 0) {
      report += '🐌 SLOWEST ENDPOINTS (by average duration)\n';
      report += '-'.repeat(80) + '\n';
      const sortedByDuration = Array.from(analysis.endpoints.entries())
        .filter(([, stats]) => stats.avgDuration > 0)
        .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
        .slice(0, 10);
      for (const [endpoint, stats] of sortedByDuration) {
        report += `  ${endpoint.padEnd(50)} `;
        report += `Avg: ${stats.avgDuration.toFixed(0)}ms `;
        report += `Count: ${stats.count} `;
        report += `Errors: ${stats.errors}\n`;
      }
      report += '\n';
    }

    // Error Peaks
    if (analysis.peakErrors.length > 0) {
      report += '⚠️  ERROR PEAKS (top 10)\n';
      report += '-'.repeat(80) + '\n';
      for (const peak of analysis.peakErrors) {
        report += `  ${peak.time}: ${peak.count} errors\n`;
      }
      report += '\n';
    }

    // Recent Errors
    if (analysis.errors.length > 0) {
      report += '❌ RECENT ERRORS (last 20)\n';
      report += '-'.repeat(80) + '\n';
      const recentErrors = analysis.errors.slice(-20).reverse();
      for (const error of recentErrors) {
        report += `  [${error.timestamp}] ${error.context || 'N/A'}: ${error.message.substring(0, 100)}\n`;
        if (error.statusCode) {
          report += `    Status: ${error.statusCode}\n`;
        }
        if (error.url) {
          report += `    URL: ${error.method} ${error.url}\n`;
        }
      }
      report += '\n';
    }

    // Slow Requests
    if (analysis.slowRequests.length > 0) {
      report += '🐌 SLOW REQUESTS (>1000ms, last 10)\n';
      report += '-'.repeat(80) + '\n';
      const recentSlow = analysis.slowRequests.slice(-10).reverse();
      for (const slow of recentSlow) {
        report += `  [${slow.timestamp}] ${slow.method || 'N/A'} ${slow.url || 'N/A'}: ${slow.duration}ms\n`;
      }
      report += '\n';
    }

    // Recommendations
    report += '💡 RECOMMENDATIONS\n';
    report += '-'.repeat(80) + '\n';
    if (analysis.errorRate > 5) {
      report += '  ⚠️  High error rate detected. Investigate error patterns.\n';
    }
    if (analysis.averageResponseTime > 500) {
      report += '  ⚠️  High average response time. Consider optimization.\n';
    }
    if (analysis.slowRequests.length > 10) {
      report += '  ⚠️  Many slow requests detected. Check database queries and external APIs.\n';
    }
    if (analysis.statusCodes.get(500)) {
      report += '  ⚠️  500 errors detected. Check server logs and application errors.\n';
    }
    if (analysis.statusCodes.get(429)) {
      report += '  ⚠️  Rate limiting detected (429). Consider adjusting rate limits.\n';
    }
    if (analysis.errorRate < 1 && analysis.averageResponseTime < 200) {
      report += '  ✅ System performance looks good!\n';
    }
    report += '\n';

    report += '='.repeat(80) + '\n';
    report += `Report generated at: ${new Date().toISOString()}\n`;
    report += '='.repeat(80) + '\n';

    return report;
  }

  saveReport(filename: string = 'log-analysis-report.txt'): void {
    const report = this.generateReport();
    const reportPath = join(process.cwd(), filename);
    require('fs').writeFileSync(reportPath, report, 'utf-8');
    console.log(`✓ Report saved to: ${reportPath}\n`);
  }
}

async function main() {
  const logFile = process.argv[2] || 'logs/combined.log';
  const outputFile = process.argv[3] || 'log-analysis-report.txt';

  try {
    const analyzer = new LogAnalyzer(logFile);
    analyzer.parseLogs();
    analyzer.analyze();
    
    const report = analyzer.generateReport();
    console.log(report);
    
    analyzer.saveReport(outputFile);
  } catch (error: any) {
    console.error('❌ Error analyzing logs:', error.message);
    process.exit(1);
  }
}

main();

