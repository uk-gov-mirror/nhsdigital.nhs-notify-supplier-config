export function getBasePath() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (basePath === "/") {
    return "";
  }

  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
}
