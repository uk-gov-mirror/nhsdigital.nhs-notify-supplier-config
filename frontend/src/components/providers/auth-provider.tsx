"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import type { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import amplifyConfig from "@/amplify_outputs.json";

Amplify.configure(amplifyConfig, { ssr: true });

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AuthProvider({ children }: AuthProviderProps) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
