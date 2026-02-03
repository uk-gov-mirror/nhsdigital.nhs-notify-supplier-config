import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "./.reports/unit/coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "babel",

  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: -10,
    },
  },

  coveragePathIgnorePatterns: ["/__tests__/", "/cli.ts"],

  // Use this configuration option to add custom reporters to Jest
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Test Report",
        outputPath: "./.reports/unit/test-report.html",
        includeFailureMsg: true,
      },
    ],
  ],

  moduleNameMapper: {
    "^@supplier-config/cli-eventbus-publish/(.*)$": "<rootDir>/src/$1",
    "^@supplier-config/event-builder/(.*)$":
      "<rootDir>/../event-builder/src/$1",
    "^@supplier-config/event-builder$":
      "<rootDir>/../event-builder/src/index.ts",
    "^@supplier-config/excel-parser/(.*)$": "<rootDir>/../excel-parser/src/$1",
    "^@supplier-config/excel-parser$": "<rootDir>/../excel-parser/src/index.ts",
  },

  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false,
          },
          target: "es2022",
        },
      },
    ],
  },
};

export default config;
