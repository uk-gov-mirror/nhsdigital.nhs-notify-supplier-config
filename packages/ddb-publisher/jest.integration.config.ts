import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  clearMocks: true,
  collectCoverage: false,
  testEnvironment: "node",
  testMatch: ["**/__integration__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testTimeout: 120_000,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
        },
      },
    ],
  },
};

export default config;
