import React from 'react';
import { ShieldCheck, GitBranch, Database, Activity, Brain, FileJson } from 'lucide-react';

export default function Capabilities() {
  const cards = [
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: 'Guardrails & Approval Gate',
      description: 'Halt execution for human review when high-risk tools are called or budgets are exceeded.',
      tag: 'STATE: AWAITING_APPROVAL',
      tagColor: 'text-accent-approval'
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: 'Multi-Provider Fallback',
      description: 'Seamlessly failover from Claude to OpenAI if rate limits or outages occur, without changing code.',
      tag: 'STATE: EXECUTING',
      tagColor: 'text-muted'
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Structured Output & Self-Repair',
      description: 'Enforce strict schema compliance. The runtime automatically prompts the model to fix malformed JSON.',
      tag: 'STATE: VERIFYING',
      tagColor: 'text-muted'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: 'Multi-Agent Handoffs',
      description: 'Route tasks between specialized agents while maintaining a unified conversational state and memory.',
      tag: 'STATE: PLANNING',
      tagColor: 'text-muted'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'Memory & Sessions',
      description: 'Built-in episodic and factual memory systems to persist context across long-running interactions.',
      tag: 'STATE: DONE',
      tagColor: 'text-muted'
    },
    {
      icon: <FileJson className="w-5 h-5" />,
      title: 'Tracing & Observability',
      description: 'Export OpenTelemetry traces for every tool call, generation step, and state transition.',
      tag: 'STATE: VERIFYING',
      tagColor: 'text-muted'
    }
  ];

  return (
    <section id="capabilities" className="py-24 px-6 max-w-7xl mx-auto">
      
      {/* Section Divider / Eyebrow */}
      <div className="flex items-center space-x-4 mb-12">
        <div className="h-px bg-line flex-1" />
        <div className="font-mono text-xs text-muted tracking-widest flex items-center space-x-2">
          <span>—</span>
          <span>fig. 02 — capabilities</span>
          <span>—</span>
        </div>
        <div className="h-px bg-line w-12" />
      </div>

      <h2 className="font-serif text-4xl md:text-[40px] text-ink mb-16">
        Every capability, verified.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 bg-line border border-line">
        {cards.map((card, i) => (
          <div key={i} className="bg-surface p-8 relative flex flex-col group border-[0.5px] border-line">
            <div className="text-muted mb-6">
              {card.icon}
            </div>
            
            <h3 className="text-ink font-semibold mb-3">{card.title}</h3>
            
            <p className="text-muted text-sm leading-relaxed mb-12">
              {card.description}
            </p>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-line/50">
              <span className={`font-mono text-[10px] tracking-wider ${card.tagColor}`}>
                {card.tag}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-line group-hover:bg-ink transition-colors" />
            </div>
          </div>
        ))}
      </div>
      
    </section>
  );
}
