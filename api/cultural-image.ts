const CULTURAL_IMAGES: Record<string, string> = {
  kamakhya: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kamakhya%20Temple%20in%20Assam.jpg?width=900',
  umananda: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Umananda%20Mandir.jpg?width=900',
  navagraha: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/NAVAGRAHA%20TEMPLE%20GUWAHATI.jpg?width=900',
  hayagriva: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hayagriva%20Madhav%20temple.jpg?width=900',
  nartiang: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nartiang%20Durga%20temple.jpg?width=900',
  tripurasundari: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tripura%20sundari%20temple.jpg?width=900',
  tawang: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/TawangMonastery.jpg?width=900',
  madan: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Madan%20Kamdev%20Temple.jpg?width=900',
  dirgheswari: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dirgheswari%20Temple.jpg?width=900',
  loktak: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Loktak%20Lake%20View.jpg?width=900',
  kaziranga: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rhinoceros%20Kaziranga.jpg?width=900',
  mawlynnong: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mawlynnong.jpg?width=900',
  hornbill: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Great%20hornbills%20-%20pride%20of%20Nagaland.jpg?width=900',
  bamboo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bamboo%20basket.jpg?width=900',
  pitha: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Assamese%20pitha.jpg?width=900',
  bihu: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bihu%20in%20Assam.jpg?width=900',
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
