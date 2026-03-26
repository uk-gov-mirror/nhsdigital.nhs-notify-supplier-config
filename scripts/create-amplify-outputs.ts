import fs from "node:fs/promises";
import path from "node:path";

type TerraformOutputs = {
  api_base_url?: { value?: string };
  cognito_user_pool_id?: { value?: string };
  cognito_user_pool_client_id?: { value?: string };
  aws_region?: { value?: string };
};

type AmplifyOutputs = {
  auth?: {
    aws_region?: string;
    user_pool_id?: string;
    user_pool_client_id?: string;
    login_with?: {
      email?: boolean;
    };
  };
  Auth?: {
    Cognito?: {
      userPoolId?: string;
      userPoolClientId?: string;
      loginWith?: {
        email?: boolean;
      };
    };
  };
  meta: {
    api_base_url?: string;
  };
};

const inputType = process.argv[2];
const rootDir = path.resolve(import.meta.dirname, "..");
const outputPath = path.resolve(rootDir, "frontend", "amplify_outputs.json");
const terraformOutputsPath = path.resolve(rootDir, "sandbox_tf_outputs.json");

async function readTerraformOutputs(): Promise<TerraformOutputs> {
  const fileContents = await fs.readFile(terraformOutputsPath, "utf8");
  return JSON.parse(fileContents) as TerraformOutputs;
}

function buildOutputs(values: {
  apiBaseUrl?: string;
  awsRegion?: string;
  userPoolClientId?: string;
  userPoolId?: string;
}): AmplifyOutputs {
  return {
    auth: {
      aws_region: values.awsRegion,
      login_with: {
        email: true,
      },
      user_pool_client_id: values.userPoolClientId,
      user_pool_id: values.userPoolId,
    },
    Auth: {
      Cognito: {
        loginWith: {
          email: true,
        },
        userPoolClientId: values.userPoolClientId,
        userPoolId: values.userPoolId,
      },
    },
    meta: {
      api_base_url: values.apiBaseUrl,
    },
  };
}

async function main() {
  let outputs: AmplifyOutputs;

  if (inputType === "file") {
    const terraformOutputs = await readTerraformOutputs();
    outputs = buildOutputs({
      apiBaseUrl: terraformOutputs.api_base_url?.value,
      awsRegion: terraformOutputs.aws_region?.value,
      userPoolClientId: terraformOutputs.cognito_user_pool_client_id?.value,
      userPoolId: terraformOutputs.cognito_user_pool_id?.value,
    });
  } else if (inputType === "env") {
    outputs = buildOutputs({
      apiBaseUrl: process.env.API_BASE_URL,
      awsRegion: process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION,
      userPoolClientId:
        process.env.USER_POOL_CLIENT_ID ??
        process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      userPoolId:
        process.env.USER_POOL_ID ?? process.env.NEXT_PUBLIC_USER_POOL_ID,
    });
  } else {
    throw new Error('Expected input type to be either "file" or "env".');
  }

  await fs.writeFile(outputPath, `${JSON.stringify(outputs, null, 2)}\n`);
}

void main();
