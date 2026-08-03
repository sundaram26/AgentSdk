import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full">
      {/* Closing CTA */}
      <div className="py-32 px-6 flex flex-col items-center text-center">
        <h2 className="font-serif text-5xl md:text-6xl text-ink mb-6">
          Start building.
        </h2>
        <div className="mb-12 inline-block border border-line bg-surface rounded-full px-4 py-2">
          <code className="font-mono text-sm text-ink">npm install @weave-agent/core</code>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <a href="https://weave-docs.sundaramsingh.com" className="w-full sm:w-auto bg-ink text-surface rounded-full px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
            Read the Docs
          </a>
          <a href="https://github.com/sundaram26/AgentSdk" className="w-full sm:w-auto bg-transparent border border-line text-ink rounded-full px-8 py-3 text-sm font-medium hover:bg-black/5 transition-colors">
            View on GitHub
          </a>
        </div>
      </div>

      {/* Actual Footer */}
      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          <div className="font-serif font-semibold tracking-widest text-ink uppercase text-sm" style={{ fontVariant: 'small-caps' }}>
            Weave
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted">
            <a href="https://weave-docs.sundaramsingh.com" className="hover:text-ink transition-colors">Docs</a>
            <a href="https://github.com/sundaram26/AgentSdk" className="hover:text-ink transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/@weave-agent/core" className="hover:text-ink transition-colors">npm</a>
            <a href="#examples" className="hover:text-ink transition-colors">Examples</a>
            <a href="#license" className="hover:text-ink transition-colors">License</a>
          </div>

        </div>
      </div>
    </footer>
  );
}
