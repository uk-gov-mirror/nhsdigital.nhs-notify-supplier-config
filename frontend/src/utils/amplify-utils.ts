/* eslint-disable @typescript-eslint/no-require-imports */
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import type { FetchAuthSessionOptions } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import { getDisplayName, getGroupsFromClaims } from "@/utils/token-utils";

const config = require("@/amplify_outputs.json");

export const { runWithAmplifyServerContext } = createServerRunner({ config });

export type Session = {
  accessToken?: string;
  displayName?: string;
  groups: string[];
  idToken?: string;
  isAdmin: boolean;
};

export async function getSessionServer(
  options: FetchAuthSessionOptions = {},
): Promise<Session> {
  const authSession = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: (contextSpec: Parameters<typeof fetchAuthSession>[0]) =>
      fetchAuthSession(contextSpec, options),
  }).catch(() => null);

  const accessToken = authSession?.tokens?.accessToken?.toString();
  const idToken = authSession?.tokens?.idToken?.toString();
  const groups = authSession?.tokens?.idToken
    ? getGroupsFromClaims(
        authSession.tokens.idToken.payload as Record<string, unknown>,
      )
    : [];

  return {
    accessToken,
    displayName: getDisplayName(idToken),
    groups,
    idToken,
    isAdmin: groups.includes("admin"),
  };
}
