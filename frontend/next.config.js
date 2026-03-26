/** @type {import('next').NextConfig} */

const fs = require("node:fs");
const path = require("node:path");

const amplifyOutputsPath = path.resolve(__dirname, "amplify_outputs.json");
const amplifyConfig = fs.existsSync(amplifyOutputsPath)
  ? JSON.parse(fs.readFileSync(amplifyOutputsPath, "utf8"))
  : {};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = () => {
  return {
    basePath,
    env: {
      API_BASE_URL:
        process.env.API_BASE_URL ?? amplifyConfig?.meta?.api_base_url ?? "",
      basePath,
    },
    reactStrictMode: true,
    sassOptions: {
      quietDeps: true,
    },
    pageExtensions: ["ts", "tsx", "js", "jsx"],
  };
};

module.exports = nextConfig;
