'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function HeroDiagram() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText('HeroDiagram SVG');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-6 relative w-full rounded-xl overflow-hidden group" style={{ border: '1px solid var(--fd-border)', backgroundColor: 'hsl(var(--fd-card))' }}>
            
            {/* Standard Code Block Header / Copy Button */}
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    title="Copy Code"
                    style={{ backgroundColor: 'hsl(var(--fd-card))', border: '1px solid var(--fd-border)', color: 'hsl(var(--fd-foreground))' }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium hover:opacity-80 transition-all shadow-sm"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[1.5]" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                    )}
                </button>
            </div>
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="font-mono text-xs font-medium" style={{ color: 'hsl(var(--fd-muted-foreground))' }}>
                    Runtime state machine
                </span>
            </div>

            {/* Content Area */}
            <div className="w-full pt-12 pb-6 px-4 flex justify-center items-center">
                <div className="relative w-full max-w-5xl aspect-[21/9] min-h-[300px]">
                    <svg viewBox="0 0 1000 400" className="w-full h-full stroke-current" style={{ color: 'hsl(var(--fd-muted-foreground))' }}>
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
                            </pattern>
                            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none" />
                            </marker>
                        </defs>

                        {/* Background Grid */}
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Tick marks along the edges */}
                        <g strokeWidth="1" stroke="currentColor" opacity="0.5">
                            <path d="M 0 20 L 5 20 M 0 60 L 5 60 M 0 100 L 5 100 M 0 140 L 5 140 M 0 180 L 5 180 M 0 220 L 5 220 M 0 260 L 5 260 M 0 300 L 5 300 M 0 340 L 5 340 M 0 380 L 5 380" />
                            <path d="M 40 0 L 40 5 M 120 0 L 120 5 M 200 0 L 200 5 M 280 0 L 280 5 M 360 0 L 360 5 M 440 0 L 440 5 M 520 0 L 520 5 M 600 0 L 600 5 M 680 0 L 680 5 M 760 0 L 760 5 M 840 0 L 840 5 M 920 0 L 920 5" />
                        </g>

                        {/* Node Styles */}
                        <g strokeWidth="1" style={{ fill: 'hsl(var(--fd-background))', stroke: 'hsl(var(--fd-border))' }}>
                            {/* PLANNING Node */}
                            <rect x="80" y="160" width="140" height="60" />
                            <text x="150" y="195" textAnchor="middle" style={{ fill: 'hsl(var(--fd-foreground))' }} className="font-mono text-xs font-medium tracking-widest" stroke="none">PLANNING</text>
                            <text x="80" y="150" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">state.id: 0x01</text>
                            <text x="80" y="235" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">Δ token budget</text>

                            {/* EXECUTING Node */}
                            <rect x="320" y="160" width="140" height="60" />
                            <text x="390" y="195" textAnchor="middle" style={{ fill: 'hsl(var(--fd-foreground))' }} className="font-mono text-xs font-medium tracking-widest" stroke="none">EXECUTING</text>
                            <text x="320" y="150" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">maxTurns: 10</text>
                            <text x="465" y="170" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">+</text>

                            {/* AWAITING_APPROVAL Node (Gold accent) */}
                            <rect x="560" y="80" width="160" height="60" stroke="#eab308" />
                            <text x="640" y="115" textAnchor="middle" fill="#eab308" stroke="none" className="font-mono text-[11px] font-bold tracking-widest">AWAITING_APPROVAL</text>
                            <text x="560" y="70" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">guardrail: strict</text>
                            
                            {/* VERIFYING Node */}
                            <rect x="560" y="240" width="140" height="60" />
                            <text x="630" y="275" textAnchor="middle" style={{ fill: 'hsl(var(--fd-foreground))' }} className="font-mono text-xs font-medium tracking-widest" stroke="none">VERIFYING</text>
                            <text x="560" y="230" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">retries: 2</text>

                            {/* DONE Node */}
                            <rect x="800" y="160" width="120" height="40" />
                            <text x="860" y="185" textAnchor="middle" style={{ fill: 'hsl(var(--fd-foreground))' }} className="font-mono text-xs font-medium tracking-widest" stroke="none">DONE</text>

                            {/* FAILED Node */}
                            <rect x="800" y="250" width="120" height="40" strokeDasharray="4 4" />
                            <text x="860" y="275" textAnchor="middle" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-xs font-medium tracking-widest">FAILED</text>
                        </g>

                        {/* Connection Lines */}
                        <g strokeWidth="1" fill="none" markerEnd="url(#arrow)" style={{ stroke: 'hsl(var(--fd-muted-foreground))' }} opacity="0.6">
                            {/* PLANNING -> EXECUTING */}
                            <path d="M 220 190 L 310 190" />
                            
                            {/* EXECUTING -> AWAITING_APPROVAL */}
                            <path d="M 460 180 L 500 180 L 500 110 L 550 110" />
                            
                            {/* EXECUTING -> VERIFYING */}
                            <path d="M 460 200 L 500 200 L 500 270 L 550 270" />
                            
                            {/* AWAITING_APPROVAL -> EXECUTING (Reject) */}
                            <path d="M 640 140 L 640 160 L 390 160" markerEnd="none" strokeDasharray="2 2" />
                            <text x="530" y="155" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">reject</text>
                            
                            {/* AWAITING_APPROVAL -> DONE */}
                            <path d="M 720 110 L 860 110 L 860 150" />
                            <text x="770" y="105" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">approve</text>

                            {/* VERIFYING -> EXECUTING (Retry) */}
                            <path d="M 630 240 L 630 220 L 390 220" markerEnd="none" />
                            <text x="530" y="215" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">fail (repair)</text>

                            {/* VERIFYING -> DONE */}
                            <path d="M 700 270 L 760 270 L 760 180 L 790 180" />
                            <text x="725" y="265" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">pass</text>
                            
                            {/* VERIFYING -> FAILED */}
                            <path d="M 700 280 L 790 280" strokeDasharray="2 2" />
                            <text x="725" y="295" style={{ fill: 'hsl(var(--fd-muted-foreground))' }} stroke="none" className="font-mono text-[9px]">max_retries</text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
}
