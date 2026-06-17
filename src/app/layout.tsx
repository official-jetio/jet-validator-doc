import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "jet-validator",
    template: "%s | jet-validator",
  },
  description: "The fastest JSON Schema validator in JavaScript",
};

const banner = (
  <Banner storageKey="jet-validator-banner">
    jet-validator docs are live 🎉
  </Banner>
);
const navbar = <Navbar logo={<b>jet-validator</b>} />;
const footer = (
  <Footer>MIT {new Date().getFullYear()} © jet-validator.</Footer>
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body
        className={`${outfit.className}  antialiased`}
      >
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/official-jetio/jet-validator-doc"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}