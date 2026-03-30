import { AuthPageContent } from "@/components/auth-page-content";
import { getBasePath } from "@/utils/get-base-path";

type AuthPageProps = Readonly<{
  searchParams: Promise<{
    error?: string | string[];
    redirect?: string | string[];
  }>;
}>;

function getFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTarget = getFirstValue(resolvedSearchParams.redirect);
  const error = getFirstValue(resolvedSearchParams.error);

  return (
    <AuthPageContent
      error={error}
      redirectTarget={redirectTarget || getBasePath() || "/"}
    />
  );
}
