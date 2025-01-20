import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['assets', 'frontend', 'cypress.json', 'reporter-config.json'],
  }),
  {
    rules: {
      'max-classes-per-file': 'off',
    },
  },
]
