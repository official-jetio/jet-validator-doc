# jet-validator-doc

The documentation site for [@jetio/validator](https://github.com/official-jetio/validator) — a fast, spec-compliant JSON Schema validator for JavaScript and TypeScript.

🌐 **Live site:** [https://jet-validator-docs.vercel.app](https://jet-validator-docs.vercel.app)

---

## Built With

- [Next.js](https://nextjs.org) — React framework
- [Nextra v4](https://nextra.site) — documentation theme
- [Pagefind](https://pagefind.app) — static search
- [MDX](https://mdxjs.com) — markdown + JSX

## Running Locally

````bash
git clone https://github.com/official-jetio/jet-validator-doc.git
cd jet-validator-doc
npm install
npm run dev
````

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

````
content/              # All documentation pages (.mdx)
  _meta.ts            # Sidebar configuration
  index.mdx           # Landing page
  getting-started.mdx
  ...
src/
  app/                # Next.js app router
  mdx-components.tsx  # Custom MDX components
public/               # Static assets
next.config.mjs       # Nextra + Next.js config
````

To edit a page, find the matching `.mdx` file in `content/` and edit it directly. Changes hot-reload in dev.

## Contributing

Found a typo, a confusing explanation, or a code example that doesn't work?

1. Click the **"Edit this page on GitHub"** link at the bottom of any docs page
2. Make the fix in GitHub's editor (or fork + PR for larger changes)
3. Open a PR — small fixes are merged quickly

For bigger changes (new pages, restructuring a section), please open an issue first to discuss.

## Reporting Issues

- **Typos / unclear docs:** [Open a docs issue](https://github.com/official-jetio/jet-validator-doc/issues)
- **Bugs in the validator itself:** [Report on the main repo](https://github.com/official-jetio/validator/issues)

## Deployment

The site is deployed to [Vercel](https://vercel.com). The `main` branch auto-deploys to production. PRs get preview deployments automatically.

## License

Documentation content is MIT licensed. See [LICENSE](./LICENSE).

---

Built by [@venerablesuprem](https://twitter.com/venerablesuprem)