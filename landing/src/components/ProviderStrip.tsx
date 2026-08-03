import React from 'react';

export default function ProviderStrip() {
  return (
    <div className="w-full flex justify-center pb-16 pt-4">
      <div className="flex items-center space-x-3 text-sm text-muted">
        <span className="font-mono text-xs uppercase tracking-widest">Works with</span>
        <span className="opacity-60">Claude</span>
        <span className="opacity-40 text-[10px]">●</span>
        <span className="opacity-60">OpenAI</span>
        <span className="opacity-40 text-[10px]">●</span>
        <span className="opacity-60">Gemini</span>
      </div>
    </div>
  );
}
