import { defineConfig } from "eslint/config";
import rootConfig from "../eslint.config.mjs";

export default defineConfig([
  ...rootConfig,
  {
    files: ["src/**/*.{ts,tsx}", "jest.setup.ts"],
    rules: {
      "import-x/prefer-default-export": 0,
      "react/react-in-jsx-scope": 0,
    },
  },
  {
    ignores: ["jest.config.mjs"],
  },
  {
    files: ["next.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": 0,
      "no-undef": 0,
      "security/detect-non-literal-fs-filename": 0,
    },
  },
  {
    files: ["amplify_outputs.json", "jestamplify_outputs.json"],
    rules: {
      "unicorn/filename-case": 0,
    },
  },
]);
