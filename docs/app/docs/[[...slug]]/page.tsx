import { source } from '@/app/source';
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export default async function Page(props: {
    params: Promise<{ slug?: string[] }>;
}) {
    const params = await props.params;
    const slug = params.slug && params.slug.length > 0 ? params.slug : [];
    const page = source.getPage(slug) ?? source.getPage(['index']) ?? source.getPages()[0];
    if (!page) notFound();

    const pageData = page.data as any;
    const MDX = pageData.body;

    return (
        <DocsPage toc={pageData.toc} full={pageData.full}>
            <DocsTitle>{pageData.title}</DocsTitle>
            <DocsDescription>{pageData.description}</DocsDescription>
            <DocsBody>
                <MDX />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}
