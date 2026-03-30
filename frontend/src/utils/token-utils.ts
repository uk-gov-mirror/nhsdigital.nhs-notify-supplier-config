import { jwtDecode } from "jwt-decode";

export type JwtClaims = Record<string, unknown>;
export const adminGroupName = "Admins";

export function decodeJwt(token: string) {
  return jwtDecode<JwtClaims>(token);
}

export function getClaimsFromToken(token?: string): JwtClaims | undefined {
  if (!token) {
    return undefined;
  }

  try {
    return decodeJwt(token);
  } catch {
    return undefined;
  }
}

export function getClaim(claims: JwtClaims, key: string) {
  const value = new Map(Object.entries(claims)).get(key);

  return value == null ? undefined : String(value);
}

export function getGroupsFromClaims(claims: JwtClaims) {
  const cognitoGroups = claims["cognito:groups"];

  if (Array.isArray(cognitoGroups)) {
    return cognitoGroups.map(String);
  }

  if (typeof cognitoGroups === "string") {
    return [cognitoGroups];
  }

  return [];
}

export function hasAdminGroupFromClaims(claims: JwtClaims) {
  return getGroupsFromClaims(claims).includes(adminGroupName);
}

export function hasAdminGroup(token: string) {
  return hasAdminGroupFromClaims(decodeJwt(token));
}

export function getDisplayName(token?: string): string | undefined {
  if (!token) {
    return undefined;
  }

  const claims = decodeJwt(token);
  const preferredUsername =
    getClaim(claims, "preferred_username") ?? getClaim(claims, "display_name");
  const givenName = getClaim(claims, "given_name");
  const familyName = getClaim(claims, "family_name");
  const fullName =
    givenName && familyName ? `${givenName} ${familyName}` : undefined;

  return (
    preferredUsername ??
    fullName ??
    getClaim(claims, "email") ??
    getClaim(claims, "sub")
  );
}
