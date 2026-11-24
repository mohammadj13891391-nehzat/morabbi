import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="96" fill="#059669"/><text x="256" y="330" font-size="260" text-anchor="middle" fill="#fff" font-family="Tahoma, sans-serif" font-weight="bold">ن</text></svg>`;
(async () => {
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile('public/app/icon-192.png');
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('public/app/icon-512.png');
  console.log('icons generated');
})().catch(e => { console.error(e); process.exit(1); });
