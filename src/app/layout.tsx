import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import type { PageMapItem } from 'nextra'
import { Anchor } from 'nextra/components'
import { normalizePages } from 'nextra/normalize-pages'
import type { FC } from 'react'

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "@jetio/validator",
    template: "%s | @jetio/validator",
  },
  description: "The fastest JSON Schema validator in JavaScript",
};

const banner = (
  <Banner storageKey="jet-validator-banner">
    @jetio/validator docs are live 🎉
  </Banner>
);
const navbar = <Navbar logo={<b>@jetio/validator</b>} />;
const footer = (
  <Footer>MIT {new Date().getFullYear()} © @jetio/validator.</Footer>
);
export const Sidebar: FC<{ pageMap: PageMapItem[] }> = ({ pageMap }) => {
  const pathname = 'usePathname();'
  const { docsDirectories } = normalizePages({
    list: pageMap,
    route: pathname
  })
 
  return (
    <div
      style={{
        background: 'lightgreen',
        padding: 20
      }}
    >
      <h3>Sidebar</h3>
      <ul
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          listStyleType: 'none',
          padding: 0,
          gap: 20
        }}
      >
        {docsDirectories.map(function renderItem(item) {
          const route =
            item.route || ('href' in item ? (item.href as string) : '')
          const { title } = item
          return (
            <li
              key={route}
              style={{ padding: '4px 4px 4px 10px', border: '1px solid' }}
            >
              {'children' in item ? (
                <details>
                  <summary>{title}</summary>
                  {item.children.map(child => renderItem(child))}
                </details>
              ) : (
                <Anchor href={route} style={{ textDecoration: 'none' }}>
                  {title}
                </Anchor>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
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