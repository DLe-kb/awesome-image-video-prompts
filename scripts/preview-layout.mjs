import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function dimensions(path) {
  const bytes = readFileSync(path);
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 16) === 'WEBPVP8 ') {
    return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  }
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error(`Unsupported preview image: ${path}`);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`Invalid JPEG preview: ${path}`);
    const marker = bytes[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
    }
    if (marker === 0xda || marker === 0xd9) break;
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error(`Missing JPEG dimensions: ${path}`);
}

export function previewRows(root, entries, rowCount) {
  const available = entries.map((entry, index) => {
    const [width, height] = dimensions(resolve(root, entry.image));
    if (!width || !height) throw new Error(`Invalid preview dimensions: ${entry.id}`);
    return { entry, index, aspect: width / height };
  });
  if (available.length < rowCount * 3) throw new Error('Not enough previews for full rows');
  const rows = [];
  for (let row = 0; row < rowCount; row++) {
    const anchor = available.findIndex(candidate => {
      const neighbors = available.filter(item => item !== candidate)
        .sort((a, b) => Math.abs(Math.log(a.aspect / candidate.aspect)) - Math.abs(Math.log(b.aspect / candidate.aspect)) || a.index - b.index);
      return neighbors[1] && Math.max(candidate.aspect, ...neighbors.slice(0, 2).map(item => item.aspect)) /
        Math.min(candidate.aspect, ...neighbors.slice(0, 2).map(item => item.aspect)) <= 1.15;
    });
    if (anchor < 0) throw new Error(`No matching preview row ${row + 1}`);
    const [first] = available.splice(anchor, 1);
    const nearest = [...available]
      .sort((a, b) => Math.abs(Math.log(a.aspect / first.aspect)) - Math.abs(Math.log(b.aspect / first.aspect)) || a.index - b.index)
      .slice(0, 2);
    for (const item of nearest) available.splice(available.indexOf(item), 1);
    rows.push([first, ...nearest].map(item => item.entry));
  }
  return rows;
}
