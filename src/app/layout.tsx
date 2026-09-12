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
  metadataBase: new URL('https://jet-validator-docs.vercel.app'),
  title: {
    default: 'jet-validator — JSON Schema compiled to fast validation functions',
    template: '%s – jet-validator',
  },
  description:
    'Compile JSON Schema into specialized JavaScript validation functions. 99%+ compliance across Draft 06 to 2020-12, ~14x faster compilation than AJV, and zero-runtime standalone output for CSP, edge, and Workers.',
  applicationName: 'jet-validator',
  keywords: ['JSON Schema', 'validator', 'AJV alternative', 'schema validation', 'TypeScript', 'standalone', 'edge', 'Cloudflare Workers'],
  openGraph: {
    type: 'website',
    siteName: 'jet-validator',
    url: 'https://jet-validator-docs.vercel.app',
    title: 'jet-validator — JSON Schema compiled to fast validation functions',
    description: 'Sub-millisecond schema compilation, 99%+ spec compliance, zero-runtime standalone output.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'jet-validator',
    description: 'JSON Schema compiled to fast validation functions. ~14x faster compile than AJV, zero-runtime standalone.',
  },
  alternates: { canonical: './' },
  robots: { index: true, follow: true },
}

const banner = (
  <Banner storageKey="jet-validator-banner">
    @jetio/validator docs are live 🎉
  </Banner>
);
const navbar = <Navbar logo={<b>@jetio/validator</b>} />;
const footer = (
  <Footer>MIT {new Date().getFullYear()} © @jetio/validator.</Footer>
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
          docsRepositoryBase="https://github.com/official-jetio/jet-validator-doc/tree/main"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}