import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['assets', 'frontend', 'cypress.json', 'reporter-config.json', 'server/@types'],
    // HMPPS eslint config doesn't recognise e2e as a test folder, so we need to add it here to avoid linting errors - 'integration_tests' is already included in the default config
    extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs', 'e2e/playwright/**'],
  }),
  {
    rules: {
      'max-classes-per-file': 'off',
    },
  },
]
