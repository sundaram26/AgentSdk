import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/app/source';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={source.pageTree}
            nav={{
                title: (
                    <span className="flex items-center gap-2 font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-50">
                        <span className="font-bold text-lg">Weave</span>
                    </span>
                ),
            }}
        >
            {children}
        </DocsLayout>
    );
}
