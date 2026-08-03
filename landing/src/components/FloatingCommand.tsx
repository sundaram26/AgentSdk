import React from 'react';
import { Command } from 'lucide-react';

export default function FloatingCommand() {
  return (
    <button
      className="fixed bottom-6 right-6 z-50 bg-surface border border-line shadow-lg rounded-full px-4 py-3 flex items-center space-x-2 text-ink hover:bg-bg/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-bg group"
      aria-label="Ask the docs"
    >
      <Command className="w-4 h-4 text-muted group-hover:text-ink transition-colors" />
      <span className="text-sm font-medium">Ask the docs</span>
    </button>
  );
}
