import React from 'react';

export default function CodeSection() {
  const codeSnippet = `import { Agent, AnthropicProvider, Memory } from 'agent-sdk';

const agent = new Agent({
  provider: new AnthropicProvider({ model: 'claude-3-5-sonnet' }),
  memory: new Memory.SessionMemory(),
  tools: [searchTool, dbTool],
  guardrails: {
    approval: ['dbTool.dropTable']
  }
});

// The runtime handles tool execution and validation automatically
const result = await agent.run("Find the latest user and drop their table");`;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-16">
        
        {/* Left Side: Copy */}
        <div className="flex-1 lg:max-w-md lg:pt-12">
          <div className="font-mono text-xs text-muted tracking-widest mb-6">
            — fig. 03 — developer experience
          </div>
          <h2 className="font-serif text-4xl md:text-[40px] text-ink leading-tight mb-6">
            Five lines to a production agent.
          </h2>
          <p className="text-muted leading-relaxed">
            Stop writing bespoke while-loops and fragile parsing logic. The SDK provides a 
            fully managed state machine that handles the complexities of LLM orchestration — 
            from multi-step tool use to schema repair and human-in-the-loop approvals.
          </p>
        </div>

        {/* Right Side: Code Block */}
        <div className="flex-1 w-full relative">
          {/* Blueprint detail callout styling */}
          <div className="absolute -inset-2 border border-line bg-surface -z-10" />
          <div className="absolute top-0 right-full w-4 border-t border-line" />
          <div className="absolute bottom-0 left-full w-4 border-b border-line" />
          
          <div className="bg-[#0D0D0D] border border-white/20 p-6 md:p-8 rounded shadow-2xl relative overflow-hidden">
            {/* Fake window controls to make it look like an editor */}
            <div className="flex space-x-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            
            <pre className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto">
              <code>
                <span className="text-[#C9A567]">import</span> {'{ Agent, AnthropicProvider, Memory }'} <span className="text-[#C9A567]">from</span> <span className="text-green-300">'agent-sdk'</span>;{'\n\n'}
                <span className="text-[#C9A567]">const</span> agent = <span className="text-[#C9A567]">new</span> <span className="text-blue-300">Agent</span>({'{'}{'\n'}
                {'  '}provider: <span className="text-[#C9A567]">new</span> <span className="text-blue-300">AnthropicProvider</span>({'{'} model: <span className="text-green-300">'claude-3-5-sonnet'</span> {'}'}),{'\n'}
                {'  '}memory: <span className="text-[#C9A567]">new</span> Memory.<span className="text-blue-300">SessionMemory</span>(),{'\n'}
                {'  '}tools: [searchTool, dbTool],{'\n'}
                {'  '}guardrails: {'{'}{'\n'}
                {'    '}approval: [<span className="text-green-300">'dbTool.dropTable'</span>]{'\n'}
                {'  }'}{'\n'}
                {'}'});{'\n\n'}
                <span className="text-gray-500">{'// The runtime handles tool execution and validation automatically'}</span>{'\n'}
                <span className="text-[#C9A567]">const</span> result = <span className="text-[#C9A567]">await</span> agent.<span className="text-blue-200">run</span>(<span className="text-green-300">"Find the latest user and drop their table"</span>);
              </code>
            </pre>
          </div>
        </div>

      </div>

    </section>
  );
}
