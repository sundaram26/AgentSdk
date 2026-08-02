import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

// construct files array manually to bridge the version mismatch between 
// fumadocs-mdx and fumadocs-core where createMDXSource returns a files() function
// but fumadocs-core loader expects a files array.
const files = [];

// Handle cases where docs/meta are exported directly as arrays from the config
const docsArray = Array.isArray(docs) ? docs : (docs as any).docs || [];
const metaArray = (docs as any).meta || [];

for (const entry of docsArray) {
    files.push({
        type: 'page',
        path: entry._file?.path || entry.file?.path,
        absolutePath: entry._file?.absolutePath || entry.file?.absolutePath,
        data: entry,
    });
}

for (const entry of metaArray) {
    files.push({
        type: 'meta',
        path: entry._file?.path || entry.file?.path,
        absolutePath: entry._file?.absolutePath || entry.file?.absolutePath,
        data: entry,
    });
}

export const source = loader({
    baseUrl: '/docs',
    source: {
        files: files as any,
    },
});
