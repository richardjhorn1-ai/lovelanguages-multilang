#!/usr/bin/env node
/**
 * MDX Validator - Checks ALL MDX files and reports ALL errors at once
 */

import { compile } from '@mdx-js/mdx';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const errors = [];
let fileCount = 0;

function walkDir(dir) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkDir(path);
    } else if (file.endsWith('.mdx')) {
      fileCount++;
      checkFile(path);
    }
  }
}

function checkFile(path) {
  try {
    const content = readFileSync(path, 'utf8');

    // Try to compile with MDX
    compile(content, { jsx: true });

  } catch (e) {
    const relPath = relative(process.cwd(), path);
    const match = e.message.match(/(\d+):(\d+)/);
    const location = match ? `:${match[1]}:${match[2]}` : '';

    errors.push({
      file: relPath + location,
      error: e.message.split('\n')[0]
    });
  }
}

console.log('🔍 Validating all MDX files...\n');

const articlesDir = join(process.cwd(), 'src/content/articles');
walkDir(articlesDir);

console.log(`📊 Scanned ${fileCount} files\n`);

if (errors.length === 0) {
  console.log('✅ All files valid!\n');
} else {
  console.log(`❌ Found ${errors.length} errors:\n`);
  errors.forEach((e, i) => {
    console.log(`${i + 1}. ${e.file}`);
    console.log(`   ${e.error}\n`);
  });
}

process.exit(errors.length > 0 ? 1 : 0);
