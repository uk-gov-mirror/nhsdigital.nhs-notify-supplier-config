import type { Metadata } from "next";
import "@aws-amplify/ui-react/styles.css";
import "@/styles/app.scss";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  description: "NHS Notify supplier configuration administration",
  title: "Supplier config admin - NHS Notify",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="nhsuk-skip-link" href="#main-content">
          Skip to main content
        </a>
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
