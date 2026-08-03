'use client';

import { useEffect, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Eye, Code } from 'lucide-react';

export function Mermaid({ chart, title }: { chart: string; title?: string }) {
    const [showCode, setShowCode] = useState(false);
    const [svg, setSvg] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const id = useId().replace(/:/g, '');

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
                fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
                primaryColor: '#262626',
                primaryTextColor: '#f5f5f5',
                primaryBorderColor: '#525252',
                lineColor: '#a3a3a3',
                secondaryColor: '#171717',
                tertiaryColor: '#0a0a0a',
                noteBkgColor: '#fef08a',
                noteTextColor: '#713f12',
                noteBorderColor: '#eab308',
                stateBkg: '#262626',
                stateLabelColor: '#ffffff',
                transitionColor: '#a3a3a3',
                transitionLabelColor: '#e5e5e5',
            },
        });

        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(`mermaid-${id}`, chart);
                setSvg(svg);
            } catch (err) {
                console.error('Mermaid render error:', err);
            }
        };

        renderChart();
    }, [chart, id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(chart);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-6 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] overflow-hidden shadow-sm">
            {/* Header Control Bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#181818] px-4 py-2 text-xs select-none">
                <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    {title || 'stateDiagram-v2'}
                </span>

                {/* Right Side Control Buttons */}
                <div className="flex items-center gap-1.5">
                    {/* Eye / Code Toggle Button */}
                    <button
                        onClick={() => setShowCode(!showCode)}
                        title={showCode ? 'Switch to Diagram Preview' : 'Switch to Raw Code'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                            showCode
                                ? 'border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#222222] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a]'
                        }`}
                    >
                        {showCode ? (
                            <>
                                <Code className="w-3.5 h-3.5 stroke-[1.5]" />
                                <span>Code</span>
                            </>
                        ) : (
                            <>
                                <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                                <span>Preview</span>
                            </>
                        )}
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        title="Copy Code"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#222222] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-all font-medium"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[1.5]" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex justify-center overflow-auto min-h-[180px] items-center bg-white dark:bg-[#111111]">
                {showCode ? (
                    <pre className="w-full text-xs font-mono text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-[#161616] p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto m-0">
                        <code>{chart}</code>
                    </pre>
                ) : svg ? (
                    <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center max-w-4xl" />
                ) : (
                    <div className="text-neutral-500 text-xs font-mono py-8">Rendering state diagram...</div>
                )}
            </div>
        </div>
    );
}
