import nextra from 'nextra'
 
const withNextra = nextra({
  defaultShowCopyCode: true,
})
 
export default withNextra({
 turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './src/mdx-components.tsx',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
})