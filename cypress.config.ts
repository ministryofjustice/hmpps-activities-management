/* eslint-disable no-console */
import { defineConfig } from 'cypress'
import cypressSplit from 'cypress-split'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import stubs from './integration_tests/mockApis/stubs'

export default defineConfig({
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      on('task', {
        reset: resetStubs,
        ...stubs,
        log(message) {
          console.log(message)

          return null
        },
        table(message) {
          console.table(message)

          return null
        },
      })
      cypressSplit(on, config)
      return config
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
