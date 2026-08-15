import * as fs from 'fs';
import * as path from 'path';

interface AnyOccurrence {
    filePath: string;
    line: number;
    content: string;
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDirectory(fullPath, fileList);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function checkNoAnyInWorkspace(): void {
    const srcDir = path.resolve(process.cwd(), 'src');
    const tsFiles = scanDirectory(srcDir);
    const occurrences: AnyOccurrence[] = [];

    // RegEx patterns for explicit `any` usage in TS code
    // Matches `: any`, `as any`, `<any>`, `any[]`
    const anyRegex = /(:\s*any\b|\bas\s+any\b|<any>|\bany\[\])/g;

    for (const filePath of tsFiles) {
        const relativePath = path.relative(process.cwd(), filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        lines.forEach((lineText, index) => {
            // Ignore single-line comments or block comments starting with //
            const trimmed = lineText.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                return;
            }

            if (anyRegex.test(lineText)) {
                occurrences.push({
                    filePath: relativePath,
                    line: index + 1,
                    content: trimmed,
                });
            }
        });
    }

    console.log(`\n🔍 Code Quality Audit: Scanning ${tsFiles.length} files in 'src/' for explicit 'any' types...\n`);

    if (occurrences.length === 0) {
        console.log('✅ EXCELLENT! No explicit `any` types found in `src/` codebase.\n');
    } else {
        console.warn(`⚠️ WARNING: Found ${occurrences.length} explicit 'any' type occurrence(s):\n`);
        occurrences.forEach((occ) => {
            console.warn(`  - [${occ.filePath}:${occ.line}] ${occ.content}`);
        });
        console.log('\n💡 Tip: Consider replacing `any` with `unknown`, generics, or specific interface types.\n');
    }
}

checkNoAnyInWorkspace();
