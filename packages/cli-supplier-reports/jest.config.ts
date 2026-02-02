import type { Config } from "jest";

const config: Config = {
  moduleNameMapper: {
    "^@supplier-config/cli-supplier-reports/(.*)$": "<rootDir>/src/$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
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
