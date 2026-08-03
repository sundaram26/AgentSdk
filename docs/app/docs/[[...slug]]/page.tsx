import { source } from '@/app/source';
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Steps, Step } from 'fumadocs-ui/components/steps';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { StateMachineDiagram } from '@/app/components/state-machine-diagram';
import { Mermaid } from '@/app/components/mermaid';
import { notFound } from 'next/navigation';

export default async function Page(props: {
    params: Promise<{ slug?: string[] }>;
}) {
    const params = await props.params;
    const slug = params.slug && params.slug.length > 0 ? params.slug : [];
    const page = source.getPage(slug) ?? source.getPage(['getting-started', 'quickstart']) ?? source.getPages()[0];
    if (!page) notFound();

    const pageData = page.data as any;
    const MDX = pageData.body;

    const extractMermaidChart = (props: any): string | null => {
        const getCodeText = (node: any): string => {
            if (!node) return '';
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (Array.isArray(node)) return node.map(getCodeText).join('\n');
            if (node.props?.children) return getCodeText(node.props.children);
            return '';
        };

        const text = getCodeText(props).trim();
        const isMermaid =
            props?.['data-language'] === 'mermaid' ||
            props?.className?.includes('mermaid') ||
            text.startsWith('stateDiagram') ||
            text.startsWith('graph ') ||
            text.startsWith('sequenceDiagram');

        return isMermaid && text ? text : null;
    };

    const defaultComponents = defaultMdxComponents as Record<string, any>;

    return (
        <DocsPage toc={pageData.toc} full={pageData.full}>
            <DocsTitle>{pageData.title}</DocsTitle>
            <DocsDescription>{pageData.description}</DocsDescription>
            <DocsBody>
                <MDX
                    components={{
                        ...defaultMdxComponents,
                        Tabs,
                        Tab,
                        Callout,
                        Card,
                        Cards,
                        Steps,
                        Step,
                        TypeTable,
                        Accordion,
                        Accordions,
                        StateMachineDiagram,
                        Mermaid,
                        figure: (props: any) => {
                            const chart = extractMermaidChart(props);
                            if (chart) {
                                return <Mermaid chart={chart} />;
                            }
                            const DefaultFigure = defaultComponents.figure || 'figure';
                            return <DefaultFigure {...props} />;
                        },
                        pre: (props: any) => {
                            const chart = extractMermaidChart(props);
                            if (chart) {
                                return <Mermaid chart={chart} />;
                            }
                            const DefaultPre = defaultComponents.pre || 'pre';
                            return <DefaultPre {...props} />;
                        },
                    }}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}
