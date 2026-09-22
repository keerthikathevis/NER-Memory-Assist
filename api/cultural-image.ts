const CULTURAL_IMAGES: Record<string, string> = {
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

export default async function handler(req: any, res: any) {
  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  const source = CULTURAL_IMAGES[id];

  if (!source) {
    res.status(404).send('Unknown cultural image');
    return;
  }

  try {
    const response = await fetch(source);
    if (!response.ok) {
      res.status(response.status).send('Cultural image unavailable');
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(buffer);
  } catch {
    res.status(502).send('Unable to load cultural image');
  }
}
