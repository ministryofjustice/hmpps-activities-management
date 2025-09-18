export default {
  preset: 'ts-jest',
  transform: {
    '^.+.[tj]sx?$': ['ts-jest'],
  },
  collectCoverageFrom: ['server/**/*.{ts,js,jsx,mjs}'],
  testMatch: ['<rootDir>/(server|frontend|job)/**/?(*.)(cy|test).{ts,js,jsx,mjs}'],
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test_results/jest/',
      },
    ],
  ],
  moduleFileExtensions: ['web.js', 'mjs', 'js', 'json', 'node', 'ts'],
  setupFilesAfterEnv: ['<rootDir>jest.setup.ts'],
}
