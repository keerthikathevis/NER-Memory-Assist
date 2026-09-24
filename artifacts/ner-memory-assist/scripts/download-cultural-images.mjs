import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.join(process.cwd(), 'public', 'cultural-images');
const images = {
  kamakhya: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kamakhya%20Temple%20Assam%20India.jpg?width=900',
  umananda: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Umananda%20Temple%2C%20Guwahati.jpg?width=900',
  navagraha: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Navagraha%20Temple%2C%20Guwahati%2001.jpg?width=900',
  hayagriva: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hayagriva%20Madhav%20temple.jpg?width=900',
  nartiang: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nartiang%20Durga%20Temple.jpg?width=900',
  tripurasundari: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tripura%20sundari%20temple.jpg?width=900',
  tawang: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/TawangMonastery.jpg?width=900',
  madan: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Madan%20Kamdev%20Temple.jpg?width=900',
  dirgheswari: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dirgheswari%20Temple.jpg?width=900',
  loktak: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Loktak%20Lake%20View.jpg?width=900',
  kaziranga: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rhinoceros%20Kaziranga.jpg?width=900',
  mawlynnong: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mawlynnong.jpg?width=900',
  hornbill: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Great%20Indian%20Hornbill.jpg?width=900',
  bamboo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%22Duli%22%20-%20a%20large%20bamboo%20basket%20used%20for%20storing%20seeds%20of%20paddy%2C%20mustard%2C%20etc.%2C%20commonly%20used%20in%20Assam%2002.jpg?width=900',
  pitha: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Assamese%20pitha.jpg?width=900',
  bihu: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/The%20Bihu%20dance%20in%20Assam.jpg?width=900',
};

await fs.mkdir(outputDir, { recursive: true });
for (const [id, url] of Object.entries(images)) {
  const target = path.join(outputDir, id + '.jpg');
  try {
    const stat = await fs.stat(target);
    if (stat.size > 1024) continue;
  } catch {}
  const response = await fetch(url, { headers: { 'User-Agent': 'NER-Memory-Assist/1.0' } });
  if (!response.ok) throw new Error('Failed to download ' + id + ': HTTP ' + response.status);
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error('Invalid image response for ' + id + ': ' + type);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 1024) throw new Error('Downloaded image is unexpectedly small: ' + id);
  await fs.writeFile(target, bytes);
}
console.log('Cultural photos bundled locally for offline games.');