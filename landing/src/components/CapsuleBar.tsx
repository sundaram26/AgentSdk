import React from 'react';
import { Wrench, ShieldCheck, Brain, FileJson, ChevronDown } from 'lucide-react';

export default function CapsuleBar() {
  const items = [
    { icon: <Wrench className="w-4 h-4" />, label: 'Provider' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Guardrails' },
    { icon: <Brain className="w-4 h-4" />, label: 'Memory' },
    { icon: <FileJson className="w-4 h-4" />, label: 'Output' },
  ];

  return (
    <div className="w-full flex justify-center px-4 -mt-6 mb-16 relative z-10">
      <div className="bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full p-2 flex flex-col md:flex-row items-center border border-line">
        
        <div className="flex flex-wrap md:flex-nowrap justify-center">
          {items.map((item, idx) => (
            <div key={item.label} className="flex items-center space-x-3 px-6 py-2 md:border-r border-line last:border-r-0 cursor-pointer hover:bg-bg/50 transition-colors rounded-full md:rounded-none">
              <div className="text-muted">{item.icon}</div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink">{item.label}</span>
                <div className="flex items-center text-muted text-xs space-x-1">
                  <span>Select</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <a href="https://weave-docs.sundaramsingh.com" className="mt-4 md:mt-0 md:ml-2 bg-ink text-surface rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity flex items-center space-x-2">
          <span>View Docs</span>
          <span className="text-lg leading-none">→</span>
        </a>
      </div>
    </div>
  );
}
