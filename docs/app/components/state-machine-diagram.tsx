import type { JSX } from 'react';

export function StateMachineDiagram(): JSX.Element {
  return (
    <div style={{ margin: '1.5rem 0', width: '100%', overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid var(--fd-border)', backgroundColor: 'var(--fd-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        viewBox="0 0 840 560"
        style={{ width: '100%', maxWidth: '52rem', height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#737373" />
          </marker>
          <marker
            id="arrow-green"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>
          <marker
            id="arrow-red"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
          <marker
            id="arrow-amber"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>
          <marker
            id="arrow-indigo"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
          </marker>
        </defs>

        {/* Start State Dot [*] */}
        <circle cx="420" cy="22" r="10" fill="var(--fd-foreground)" />
        <line x1="420" y1="32" x2="420" y2="65" stroke="#737373" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* 1. PLANNING */}
        <g transform="translate(330, 65)">
          <rect width="180" height="54" rx="10" fill="var(--fd-secondary)" stroke="var(--fd-border)" strokeWidth="1.5" />
          <text x="90" y="32" textAnchor="middle" fill="var(--fd-foreground)" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif">PLANNING</text>
        </g>

        {/* 2. EXECUTING */}
        <g transform="translate(150, 185)">
          <rect width="180" height="54" rx="10" fill="var(--fd-secondary)" stroke="var(--fd-border)" strokeWidth="1.5" />
          <text x="90" y="32" textAnchor="middle" fill="var(--fd-foreground)" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif">EXECUTING</text>
        </g>

        {/* 3. VERIFYING */}
        <g transform="translate(510, 185)">
          <rect width="180" height="54" rx="10" fill="var(--fd-secondary)" stroke="var(--fd-border)" strokeWidth="1.5" />
          <text x="90" y="32" textAnchor="middle" fill="var(--fd-foreground)" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif">VERIFYING</text>
        </g>

        {/* 4. AWAITING_APPROVAL */}
        <g transform="translate(30, 305)">
          <rect width="190" height="54" rx="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="95" y="32" textAnchor="middle" fill="#b45309" fontWeight="700" fontSize="12" fontFamily="system-ui, sans-serif">AWAITING_APPROVAL</text>
        </g>

        {/* 5. DONE */}
        <g transform="translate(525, 335)">
          <rect width="150" height="54" rx="10" fill="#dcfce7" stroke="#10b981" strokeWidth="1.5" />
          <text x="75" y="32" textAnchor="middle" fill="#047857" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif">DONE</text>
        </g>

        {/* 6. FAILED */}
        <g transform="translate(295, 435)">
          <rect width="150" height="54" rx="10" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1.5" />
          <text x="75" y="32" textAnchor="middle" fill="#be123c" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif">FAILED</text>
        </g>

        {/* Terminal Dots [*] */}
        {/* DONE -> [*] */}
        <line x1="600" y1="389" x2="600" y2="425" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
        <circle cx="600" cy="438" r="10" fill="#10b981" />
        <circle cx="600" cy="438" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" />

        {/* FAILED -> [*] */}
        <line x1="370" y1="489" x2="370" y2="520" stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
        <circle cx="370" cy="532" r="10" fill="#f43f5e" />
        <circle cx="370" cy="532" r="14" fill="none" stroke="#f43f5e" strokeWidth="1.5" />

        {/* Transitions */}
        {/* PLANNING -> EXECUTING */}
        <path d="M 370 119 L 260 180" stroke="#737373" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <rect x="250" y="132" width="115" height="18" rx="4" fill="var(--fd-muted)" />
        <text x="307" y="145" textAnchor="middle" fill="var(--fd-muted-foreground)" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">tool call detected</text>

        {/* PLANNING -> VERIFYING */}
        <path d="M 470 119 L 580 180" stroke="#737373" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <rect x="475" y="132" width="135" height="18" rx="4" fill="var(--fd-muted)" />
        <text x="542" y="145" textAnchor="middle" fill="var(--fd-muted-foreground)" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">final answer, no tool call</text>

        {/* EXECUTING -> AWAITING_APPROVAL */}
        <path d="M 190 239 L 140 300" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />
        <rect x="80" y="258" width="110" height="18" rx="4" fill="#fef3c7" />
        <text x="135" y="271" textAnchor="middle" fill="#b45309" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">risky action flagged</text>

        {/* AWAITING_APPROVAL -> EXECUTING */}
        <path d="M 160 305 Q 220 280 220 244" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
        <rect x="200" y="275" width="55" height="18" rx="4" fill="#dcfce7" />
        <text x="227" y="288" textAnchor="middle" fill="#047857" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">approved</text>

        {/* AWAITING_APPROVAL -> FAILED */}
        <path d="M 125 359 L 290 445" stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
        <rect x="170" y="388" width="50" height="18" rx="4" fill="#ffe4e6" />
        <text x="195" y="401" textAnchor="middle" fill="#be123c" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">rejected</text>

        {/* EXECUTING -> PLANNING */}
        <path d="M 230 185 C 230 110 300 95 325 95" stroke="#737373" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />
        <rect x="145" y="105" width="135" height="18" rx="4" fill="var(--fd-muted)" />
        <text x="212" y="118" textAnchor="middle" fill="var(--fd-muted-foreground)" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">tool result appended to context</text>

        {/* VERIFYING -> PLANNING (Self-Repair Loop) */}
        <path d="M 600 185 C 600 90 530 95 515 95" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow-indigo)" />
        <rect x="560" y="105" width="140" height="18" rx="4" fill="#e0e7ff" />
        <text x="630" y="118" textAnchor="middle" fill="#4338ca" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">schema/guardrail repair (retry)</text>

        {/* VERIFYING -> DONE */}
        <path d="M 600 239 L 600 330" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
        <rect x="610" y="275" width="80" height="18" rx="4" fill="#dcfce7" />
        <text x="650" y="288" textAnchor="middle" fill="#047857" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">validation valid</text>

        {/* VERIFYING -> FAILED */}
        <path d="M 540 239 L 410 430" stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
        <rect x="475" y="320" width="85" height="18" rx="4" fill="#ffe4e6" />
        <text x="517" y="333" textAnchor="middle" fill="#be123c" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">retries exhausted</text>

        {/* PLANNING -> FAILED (max turns exceeded) */}
        <path d="M 420 119 L 370 430" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-red)" />
        <rect x="365" y="240" width="95" height="18" rx="4" fill="#ffe4e6" />
        <text x="412" y="253" textAnchor="middle" fill="#be123c" fontWeight="500" fontSize="9" fontFamily="system-ui, sans-serif">max turns exceeded</text>

        {/* Note Callout */}
        <g transform="translate(685, 235)">
          <rect width="145" height="90" rx="8" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1" />
          <text x="10" y="20" fill="#3730a3" fontWeight="700" fontSize="10" fontFamily="system-ui, sans-serif">Self-repair loop:</text>
          <text x="10" y="36" fill="#4338ca" fontSize="9" fontFamily="system-ui, sans-serif">PLANNING ➔ VERIFYING</text>
          <text x="10" y="50" fill="#4338ca" fontSize="9" fontFamily="system-ui, sans-serif">➔ PLANNING is the</text>
          <text x="10" y="64" fill="#4338ca" fontSize="9" fontFamily="system-ui, sans-serif">structured-output and</text>
          <text x="10" y="78" fill="#4338ca" fontSize="9" fontFamily="system-ui, sans-serif">guardrail retry cycle.</text>
        </g>
      </svg>
    </div>
  );
}
