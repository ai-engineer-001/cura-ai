#!/usr/bin/env node
/**
 * Quick dataset record counter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datasetsDir = path.join(__dirname, '..', '..', 'curaai-datasets', 'datasets', 'normalized');

const files = fs.readdirSync(datasetsDir)
  .filter(f => f.endsWith('.jsonl'))
  .filter(f => f.includes('train') || f.includes('all') || f.includes('rag'))
  .sort();

console.log('Dataset Record Counts:\n');

let total = 0;
const counts = files.map(file => {
  const content = fs.readFileSync(path.join(datasetsDir, file), 'utf-8');
  const count = content.split('\n').filter(l => l.trim()).length;
  total += count;
  return { file, count };
});

counts.forEach(({ file, count }) => {
  console.log(`  ${file.padEnd(30)} ${count.toLocaleString().padStart(10)}`);
});

console.log(`\n  ${'TOTAL'.padEnd(30)} ${total.toLocaleString().padStart(10)}`);

// Estimate for 260k target
console.log('\n\nRecommendations for ~260k vectors (≤1.9 GB):');
console.log('─'.repeat(60));

// Sort by quality/utility (rough heuristic)
const priority = [
  { name: 'medqa', quality: 'high', reason: 'USMLE-style clinical' },
  { name: 'bioasq', quality: 'high', reason: 'PubMed literature' },
  { name: 'medmcqa', quality: 'medium', reason: 'Indian medical exam' },
  { name: 'pubmedqa', quality: 'medium', reason: 'Yes/no questions' },
  { name: 'medquad', quality: 'low', reason: 'Consumer health FAQs' }
];

let accumulated = 0;
const selected = [];

for (const { name, quality, reason } of priority) {
  const matching = counts.filter(c => c.file.toLowerCase().includes(name));
  const sum = matching.reduce((s, c) => s + c.count, 0);
  
  if (accumulated + sum <= 260000) {
    accumulated += sum;
    selected.push({ name, count: sum, quality, reason });
    console.log(`  ✓ Include ${name.padEnd(12)} ${sum.toLocaleString().padStart(8)} (${quality.padEnd(6)}) - ${reason}`);
  } else {
    const space = 260000 - accumulated;
    if (space > 10000) {
      console.log(`  ⚠ Partial ${name.padEnd(12)} ${space.toLocaleString().padStart(8)} (${quality.padEnd(6)}) - ${reason}`);
      accumulated = 260000;
      break;
    } else {
      console.log(`  ✗ Exclude ${name.padEnd(12)} ${sum.toLocaleString().padStart(8)} (${quality.padEnd(6)}) - ${reason}`);
    }
  }
}

console.log(`\n  Total Selected: ${accumulated.toLocaleString()} vectors`);
