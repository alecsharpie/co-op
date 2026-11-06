// Everything the players see is custom artwork: no emoji anywhere in the shipped pages, scripts or styles.
// node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHIPPED = ['index.html', 'dev.html', 'shared', 'lighthouse', 'escape', 'garden', 'spire'];
// pictographs plus the emoji presentation selector and skin tones; plain arrows and math symbols are fine
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{1F3FB}-\u{1F3FF}]/u;

function files(p) {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [p];
  return fs.readdirSync(full).flatMap(f => files(path.join(p, f)));
}

for (const area of SHIPPED) {
  test(`no emoji in ${area}`, () => {
    const hits = [];
    for (const f of files(area).filter(f => /\.(html|js|mjs|css|svg)$/.test(f))) {
      fs.readFileSync(path.join(root, f), 'utf8').split('\n').forEach((line, i) => {
        const m = line.match(EMOJI);
        if (m) hits.push(`${f}:${i + 1} ${m[0]}  ${line.trim().slice(0, 70)}`);
      });
    }
    assert.equal(hits.length, 0, `${hits.length} emoji left:\n${hits.slice(0, 15).join('\n')}`);
  });
}
