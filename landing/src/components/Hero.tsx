import React from 'react';

export default function Hero() {
  return (
    <section className="pt-32 pb-16 px-6 flex flex-col items-center text-center">
      <div className="font-mono text-xs text-muted uppercase tracking-widest mb-6">
        TypeScript Agent SDK
      </div>
      
      <h1 className="font-serif text-5xl md:text-7xl lg:text-[80px] leading-[1.1] text-ink max-w-4xl tracking-tight mb-8">
        <span className="block">Engineered for Reasoning,</span>
        <span className="block">Built for Production.</span>
      </h1>
      
      <p className="text-muted md:text-lg max-w-[600px] leading-relaxed mb-12">
        A deterministic runtime for LLM agents — typed tools, provider fallback, and
        guardrails that can't be skipped. Built in raw TypeScript, no framework lock-in.
      </p>
    </section>
  );
}
