/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  moduleNameMapper: {
    "preset": "ts-jest",
    "collectCoverageFrom": [
      "server/**/*.{ts,js,jsx,mjs}"
    ],
    "testMatch": [
      "<rootDir>/(server|frontend|job)/**/?(*.)(cy|test).{ts,js,jsx,mjs}"
    ],
    "setupFilesAfterEnv": [
      "<rootDir>jest.setup.ts"
    ],
    "testEnvironment": "node",
    "transform": {
      "^.+\\.[tj]sx?$": [
        "ts-jest"
      ]
    },
    "reporters": [
      "default",
      [
        "jest-junit",
        {
          "outputDirectory": "test_results/jest/"
        }
      ]
    ],
    "moduleFileExtensions": [
      "web.js",
      "mjs",
      "js",
      "json",
      "node",
      "ts"
    ],
    // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
    "uuid": require.resolve('uuid'),
  },
}
