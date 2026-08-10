import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  external: ['openai', '@anthropic-ai/sdk', '@google/generative-ai', 'zod']
});
