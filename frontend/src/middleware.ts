import { type NextRequest, NextResponse } from "next/server";
import { getSessionServer } from "@/utils/amplify-utils";
import { getBasePath } from "@/utils/get-base-path";

const publicPaths = [/^\/auth$/, /^\/auth\/signout$/];

function getContentSecurityPolicy(nonce: string) {
  const directives: Record<string, string[]> = {
    "base-uri": ["'self'"],
    "connect-src": ["'self'", "https://cognito-idp.eu-west-2.amazonaws.com"],
    "default-src": ["'none'"],
    "font-src": ["'self'", "https://assets.nhs.uk"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'self'"],
    "img-src": ["'self'", "data:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "script-src": ["'self'", `'nonce-${nonce}'`],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  };

  if (process.env.NODE_ENV === "development") {
    directives["script-src"].push("'unsafe-eval'");
  } else {
    directives["upgrade-insecure-requests"] = [];
  }

  return `${Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ")};`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = getContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  if (publicPaths.some((publicPath) => publicPath.test(pathname))) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  }

  const session = await getSessionServer({ forceRefresh: true });

  if (!session.accessToken || !session.idToken) {
    const redirectPath = `${getBasePath()}${pathname}`;
    return NextResponse.redirect(
      new URL(
        `/auth?redirect=${encodeURIComponent(redirectPath)}`,
        request.url,
      ),
    );
  }

  if (!session.isAdmin) {
    const redirectPath = `${getBasePath()}${pathname}`;
    return NextResponse.redirect(
      new URL(
        `/auth?error=not-admin&redirect=${encodeURIComponent(redirectPath)}`,
        request.url,
      ),
    );
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
