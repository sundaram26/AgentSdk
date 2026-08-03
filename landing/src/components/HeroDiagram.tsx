import React from 'react';

export default function HeroDiagram() {
  return (
    <div className="w-full flex justify-center py-12 px-4 relative overflow-hidden">
      {/* Soft radial drop-shadow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-black/[0.03] blur-3xl rounded-full pointer-events-none" />
      
      <div className="relative w-full max-w-5xl aspect-[21/9] min-h-[300px]">
        <svg viewBox="0 0 1000 400" className="w-full h-full text-line stroke-current">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
            </pattern>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Tick marks along the edges */}
          <path d="M 0 20 L 5 20 M 0 60 L 5 60 M 0 100 L 5 100 M 0 140 L 5 140 M 0 180 L 5 180 M 0 220 L 5 220 M 0 260 L 5 260 M 0 300 L 5 300 M 0 340 L 5 340 M 0 380 L 5 380" strokeWidth="1" stroke="currentColor" />
          <path d="M 40 0 L 40 5 M 120 0 L 120 5 M 200 0 L 200 5 M 280 0 L 280 5 M 360 0 L 360 5 M 440 0 L 440 5 M 520 0 L 520 5 M 600 0 L 600 5 M 680 0 L 680 5 M 760 0 L 760 5 M 840 0 L 840 5 M 920 0 L 920 5" strokeWidth="1" stroke="currentColor" />

          {/* Node Styles */}
          <g strokeWidth="1" fill="var(--bg)">
            
            {/* PLANNING Node */}
            <rect x="80" y="160" width="140" height="60" />
            <text x="150" y="195" textAnchor="middle" fill="var(--ink)" stroke="none" className="font-mono text-xs font-medium tracking-widest">PLANNING</text>
            <text x="80" y="150" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">state.id: 0x01</text>
            <text x="80" y="235" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">Δ token budget</text>

            {/* EXECUTING Node */}
            <rect x="320" y="160" width="140" height="60" />
            <text x="390" y="195" textAnchor="middle" fill="var(--ink)" stroke="none" className="font-mono text-xs font-medium tracking-widest">EXECUTING</text>
            <text x="320" y="150" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">maxTurns: 10</text>
            <text x="465" y="170" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">+</text>

            {/* AWAITING_APPROVAL Node (Gold accent) */}
            <rect x="560" y="80" width="160" height="60" stroke="var(--accent-approval)" />
            <text x="640" y="115" textAnchor="middle" fill="var(--accent-approval)" stroke="none" className="font-mono text-[11px] font-bold tracking-widest">AWAITING_APPROVAL</text>
            <text x="560" y="70" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">guardrail: strict</text>
            
            {/* VERIFYING Node */}
            <rect x="560" y="240" width="140" height="60" />
            <text x="630" y="275" textAnchor="middle" fill="var(--ink)" stroke="none" className="font-mono text-xs font-medium tracking-widest">VERIFYING</text>
            <text x="560" y="230" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">retries: 2</text>

            {/* DONE Node */}
            <rect x="800" y="160" width="120" height="40" />
            <text x="860" y="185" textAnchor="middle" fill="var(--ink)" stroke="none" className="font-mono text-xs font-medium tracking-widest">DONE</text>

            {/* FAILED Node */}
            <rect x="800" y="250" width="120" height="40" strokeDasharray="4 4" />
            <text x="860" y="275" textAnchor="middle" fill="var(--muted)" stroke="none" className="font-mono text-xs font-medium tracking-widest">FAILED</text>

          </g>

          {/* Connection Lines */}
          <g strokeWidth="1" fill="none" markerEnd="url(#arrow)">
            {/* PLANNING -> EXECUTING */}
            <path d="M 220 190 L 310 190" />
            
            {/* EXECUTING -> AWAITING_APPROVAL */}
            <path d="M 460 180 L 500 180 L 500 110 L 550 110" />
            
            {/* EXECUTING -> VERIFYING */}
            <path d="M 460 200 L 500 200 L 500 270 L 550 270" />
            
            {/* AWAITING_APPROVAL -> EXECUTING (Reject) */}
            <path d="M 640 140 L 640 160 L 390 160" markerEnd="none" strokeDasharray="2 2" />
            <text x="530" y="155" fill="var(--muted)" stroke="none" className="font-mono text-[9px] bg-bg">reject</text>
            
            {/* AWAITING_APPROVAL -> DONE */}
            <path d="M 720 110 L 860 110 L 860 150" />
            <text x="770" y="105" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">approve</text>

            {/* VERIFYING -> EXECUTING (Retry) */}
            <path d="M 630 240 L 630 220 L 390 220" markerEnd="none" />
            <text x="530" y="215" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">fail (repair)</text>

            {/* VERIFYING -> DONE */}
            <path d="M 700 270 L 760 270 L 760 180 L 790 180" />
            <text x="725" y="265" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">pass</text>
            
            {/* VERIFYING -> FAILED */}
            <path d="M 700 280 L 790 280" strokeDasharray="2 2" />
            <text x="725" y="295" fill="var(--muted)" stroke="none" className="font-mono text-[9px]">max_retries</text>
          </g>
          
        </svg>
      </div>
    </div>
  );
}
