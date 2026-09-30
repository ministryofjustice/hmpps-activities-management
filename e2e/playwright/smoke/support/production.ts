import fs from 'fs'
import net from 'net'
import { spawn } from 'child_process'
import { parse } from 'dotenv'
import { expect } from '@playwright/test'
import smokeTest from './fixtures'
import stubs from '../../../../integration_tests/mockApis/stubs'
import { resetStubs } from '../../../../integration_tests/mockApis/wiremock'
import { signInEAEnabled } from '../../helpers/auth'

// Error pages must be checked in production mode: development intentionally prints
// a stack trace. Start the same built application with only local mocked services.
const productionTest = smokeTest.extend({
  page: async ({ browser, playwright }, use) => {
    const listener = net.createServer()
    await new Promise<void>(resolve => {
      listener.listen(0, '127.0.0.1', resolve)
    })
    const { port } = listener.address() as net.AddressInfo
    await new Promise<void>((resolve, reject) => {
      listener.close(error => {
        if (error) reject(error)
        else resolve()
      })
    })
    const baseURL = `http://localhost:${port}`
    const child = spawn(process.execPath, ['dist/server.js'], {
      env: {
        ...process.env,
        ...parse(fs.readFileSync('feature.env')),
        NODE_ENV: 'production',
        NO_HTTPS: 'true',
        PORT: String(port),
        INGRESS_URL: baseURL,
        BUILD_NUMBER: 'smoke',
        PRODUCT_ID: 'smoke',
        GIT_REF: 'smoke',
        GIT_BRANCH: 'smoke',
        JOURNEY_DATA_TOKEN_DURATION_HOURS: '1',
        REDIS_HOST: 'localhost',
        SESSION_SECRET: 'smoke-test-session-secret',
        REPORTING_API_URL: 'http://localhost:9091',
        DPS_URL: baseURL,
        PRISONER_URL: baseURL,
        INCENTIVES_URL: baseURL,
        VIDEO_CONFERENCE_SCHEDULE_URL: baseURL,
        NON_ASSOCIATIONS_URL: baseURL,
        REPORT_A_FAULT_URL: '#',
        FEEDBACK_URL: '#',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    const collect = (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-8000)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    const api = await playwright.request.newContext({ baseURL })
    const context = await browser.newContext({ baseURL })
    try {
      await expect
        .poll(
          async () => {
            if (child.exitCode !== null) throw new Error(`Production test server exited: ${output}`)
            return api
              .get('/health/ping', { timeout: 1000 })
              .then(response => response.ok())
              .catch(() => false)
          },
          { timeout: 20000, message: 'Production test server starts' },
        )
        .toBe(true)
      await resetStubs()
      await stubs.stubSignIn()
      const page = await context.newPage()
      await signInEAEnabled(page)
      await use(page)
    } finally {
      await context.close()
      await api.dispose()
      child.kill('SIGTERM')
      await new Promise<void>(resolve => {
        if (child.exitCode !== null || child.signalCode !== null) resolve()
        else child.once('exit', () => resolve())
      })
    }
  },
})

export default productionTest
