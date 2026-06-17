import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

type PageProps = {
  params: Promise<{ mdxPath?: string[] }>;
};

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;
  const Wrapper = getMDXComponents().wrapper;
  
  if (!Wrapper) {
    return <MDXContent {...props} params={params} />;
  }
  
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode="">
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}