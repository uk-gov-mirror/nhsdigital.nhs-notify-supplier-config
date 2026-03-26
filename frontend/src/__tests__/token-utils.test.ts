import { getDisplayName, hasAdminGroup } from "@/utils/token-utils";

function encodeBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createToken(payload: Record<string, unknown>) {
  return `${encodeBase64Url({ alg: "none", typ: "JWT" })}.${encodeBase64Url(payload)}.signature`;
}

describe("token-utils", () => {
  it("recognises the admin group from Cognito groups", () => {
    const token = createToken({
      "cognito:groups": ["editor", "admin"],
    });

    expect(hasAdminGroup(token)).toBe(true);
  });

  it("returns false when the admin group is not present", () => {
    const token = createToken({
      "cognito:groups": ["viewer"],
    });

    expect(hasAdminGroup(token)).toBe(false);
  });

  it("builds a display name from token claims", () => {
    const token = createToken({
      email: "alex@example.nhs.uk",
      given_name: "Alex",
      family_name: "Morgan",
    });

    expect(getDisplayName(token)).toBe("Alex Morgan");
  });
});
