import { docs, meta } from '../docs/.source/index.ts';
import { createMDXSource } from 'fumadocs-mdx';

console.log('docs isArray:', Array.isArray(docs), 'length:', docs?.length);
console.log('meta isArray:', Array.isArray(meta), 'length:', meta?.length);

try {
    const s = createMDXSource(docs, meta);
    console.log('createMDXSource success:', Object.keys(s));
} catch (e) {
    console.error('createMDXSource failed:', e);
}
