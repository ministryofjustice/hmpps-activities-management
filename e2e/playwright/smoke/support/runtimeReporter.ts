import fs from 'fs'
import path from 'path'
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter'

// Shards run with one worker because WireMock is shared. Summed test durations show
// the smoke contribution; elapsed run time also includes setup and worker restarts.
export default class RuntimeReporter implements Reporter {
  private outputDir: string

  private shard: string

  private totals = { smoke: { tests: 0, attempts: 0, durationMs: 0 }, other: { tests: 0, attempts: 0, durationMs: 0 } }

  onBegin(config: FullConfig, suite: Suite): void {
    this.outputDir = config.projects[0].outputDir
    this.shard = config.shard ? `${config.shard.current}/${config.shard.total}` : 'unsharded'
    suite.allTests().forEach(test => {
      this.totals[test.titlePath().some(title => title.includes('@smoke')) ? 'smoke' : 'other'].tests += 1
    })
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const group = this.totals[test.titlePath().some(title => title.includes('@smoke')) ? 'smoke' : 'other']
    group.attempts += 1
    group.durationMs += result.duration
  }

  onEnd(result: FullResult): void {
    fs.mkdirSync(this.outputDir, { recursive: true })
    const report = { shard: this.shard, status: result.status, elapsedMs: result.duration, ...this.totals }
    fs.writeFileSync(path.join(this.outputDir, 'runtime.json'), `${JSON.stringify(report, null, 2)}\n`)
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        [
          `### Playwright shard ${this.shard}`,
          '',
          '| Suite | Tests | Attempts (including retries) | Test time |',
          '| --- | ---: | ---: | ---: |',
          ...Object.entries(this.totals).map(
            ([name, group]) =>
              `| ${name} | ${group.tests} | ${group.attempts} | ${(group.durationMs / 1000).toFixed(1)}s |`,
          ),
          '',
          `Elapsed: ${(result.duration / 1000).toFixed(1)}s. Status: ${result.status}.`,
          '',
        ].join('\n'),
      )
    }
  }
}
