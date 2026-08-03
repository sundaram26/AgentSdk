import React from 'react';

export default function Benchmarks() {
  const stats = [
    { value: '100%', label: 'OpenTelemetry traceable' },
    { value: 'Zero', label: 'vendor lock-in' },
    { value: '99.9%', label: 'fallback chain reliability' }
  ];

  return (
    <section id="benchmarks" className="w-full">
      {/* Top Divider */}
      <div className="w-full border-t border-line relative h-4">
        <div className="absolute top-0 left-[20%] w-px h-2 bg-line" />
        <div className="absolute top-0 left-[50%] w-px h-2 bg-line" />
        <div className="absolute top-0 left-[80%] w-px h-2 bg-line" />
      </div>

      <div className="max-w-7xl mx-auto py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="font-serif text-[80px] md:text-[100px] leading-none text-ink mb-4">
                {stat.value}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted max-w-[200px]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="w-full border-b border-line relative h-4">
        <div className="absolute bottom-0 left-[20%] w-px h-2 bg-line" />
        <div className="absolute bottom-0 left-[50%] w-px h-2 bg-line" />
        <div className="absolute bottom-0 left-[80%] w-px h-2 bg-line" />
      </div>
    </section>
  );
}
