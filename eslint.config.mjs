import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['assets', 'frontend', 'cypress.json', 'reporter-config.json', 'server/@types'],
  }),
  {
    rules: {
      'max-classes-per-file': 'off',
    },
  },
]
