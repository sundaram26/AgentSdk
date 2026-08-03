import React from 'react';
import { Package } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg border-b border-line h-16 flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex-1">
        <span className="font-serif font-semibold tracking-widest text-ink uppercase text-sm" style={{ fontVariant: 'small-caps' }}>
          Weave
        </span>
      </div>

      {/* Center */}
      <div className="hidden md:flex flex-1 justify-center space-x-8">
        <a href="https://weave-docs.sundaramsingh.com" className="text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors font-medium">
          Docs
        </a>
        {['Capabilities', 'Benchmarks', 'Examples'].map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} className="text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors font-medium">
            {item}
          </a>
        ))}
      </div>

      {/* Right */}
      <div className="flex-1 flex justify-end items-center space-x-6">
        <a href="https://github.com/sundaram26/AgentSdk" className="text-muted hover:text-ink transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-muted border border-line rounded-full px-3 py-1">
          <Package className="w-3.5 h-3.5" />
          <span>v1.0.0</span>
        </div>
        <a href="https://weave-docs.sundaramsingh.com" className="bg-ink text-surface rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
          Get Started
        </a>
      </div>
    </nav>
  );
}
