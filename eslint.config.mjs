import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['assets', 'frontend', 'cypress.json', 'reporter-config.json', 'scripts/*'],
  }),
  {
    rules: {
      'max-classes-per-file': 'off',
    },
  },
]
