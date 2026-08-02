import * as fs from 'fs';
import * as path from 'path';

interface TypeOccurrence {
    filePath: string;
    line: number;
    typeKind: 'any' | 'unknown';
    content: string;
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
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

export function auditTypeUsage(): { anyCount: number; unknownCount: number } {
    const srcDir = path.resolve(process.cwd(), 'src');
    const tsFiles = scanDirectory(srcDir);
    
    const anyOccurrences: TypeOccurrence[] = [];
    const unknownOccurrences: TypeOccurrence[] = [];

    const anyRegex = /(:\s*any\b|\bas\s+any\b|<any>|\bany\[\]|\bany\b)/g;
    const unknownRegex = /(:\s*unknown\b|\bas\s+unknown\b|<unknown>|\bunknown\[\]|\bunknown\b)/g;

    for (const filePath of tsFiles) {
        const relativePath = path.relative(process.cwd(), filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        lines.forEach((lineText, index) => {
            const trimmed = lineText.trim();
            // Ignore comment lines
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                return;
            }

            if (anyRegex.test(lineText)) {
                anyOccurrences.push({
                    filePath: relativePath,
                    line: index + 1,
                    typeKind: 'any',
                    content: trimmed,
                });
            }

            if (unknownRegex.test(lineText)) {
                unknownOccurrences.push({
                    filePath: relativePath,
                    line: index + 1,
                    typeKind: 'unknown',
                    content: trimmed,
                });
            }
        });
    }

    console.log(`\n📊 TypeScript Type Usage Audit: Scanned ${tsFiles.length} files in 'src/'\n`);
    console.log(`========================================================================`);

    // Report Explicit `any`
    if (anyOccurrences.length === 0) {
        console.log(`\n✅ ANY TYPE CHECK: 0 explicit 'any' types found in 'src/'. Excellent!`);
    } else {
        console.log(`\n❌ ANY TYPE CHECK: Found ${anyOccurrences.length} occurrence(s) of 'any':`);
        anyOccurrences.forEach((occ) => {
            console.log(`   - [${occ.filePath}:${occ.line}] ${occ.content}`);
        });
    }

    // Report Explicit `unknown`
    if (unknownOccurrences.length === 0) {
        console.log(`\nℹ️ UNKNOWN TYPE CHECK: 0 'unknown' types found in 'src/'.`);
    } else {
        console.log(`\n🔍 UNKNOWN TYPE CHECK: Found ${unknownOccurrences.length} occurrence(s) of 'unknown' (used for safe input/generic defaults):`);
        unknownOccurrences.forEach((occ) => {
            console.log(`   - [${occ.filePath}:${occ.line}] ${occ.content}`);
        });
    }

    console.log(`\n========================================================================\n`);

    return { anyCount: anyOccurrences.length, unknownCount: unknownOccurrences.length };
}

auditTypeUsage();
