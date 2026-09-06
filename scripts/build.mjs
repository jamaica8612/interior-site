import { readFile, mkdir, copyFile, cp, access } from 'node:fs/promises';
import { Script } from 'node:vm';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const block of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (block[1].includes('importmap')) JSON.parse(block[2]);
  else new Script(block[2]);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/(?:src|href|poster)="(assets\/[^"#]+)"/g)) {
  await access(resolve(root, match[1]));
}
new Script(await readFile(resolve(root, 'assets/film-sequence.js'), 'utf8'));
for (let frame = 0; frame < 192; frame++) {
  await access(resolve(root, `assets/entrance-frames/frame-${String(frame).padStart(3,'0')}.webp`));
}
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
await copyFile(resolve(root, 'index.html'), resolve(output, 'index.html'));
await cp(resolve(root, 'assets'), resolve(output, 'assets'), { recursive: true });
console.log('Static site validated and built into dist/.');
