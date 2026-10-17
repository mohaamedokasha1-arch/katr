import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const logo = fs.readFileSync(path.join(root, 'public/logo.svg'));

function maskableSvg(): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#0B3D91"/>
    <g transform="translate(128 128) scale(4)">
      <path d="M13.5 46.5h6.2c6.4 0 6.4-12.8 13.2-12.8h4.6c6.1 0 6.1-11.2 13.1-11.2" fill="none" stroke="#FFFFFF" stroke-width="4.6" stroke-linecap="round"/>
      <circle cx="13.5" cy="46.5" r="4" fill="#FFFFFF"/>
      <circle cx="33.3" cy="33.7" r="3.1" fill="#FFFFFF"/>
      <circle cx="50.6" cy="22.5" r="5.4" fill="#F4511E" stroke="#FFFFFF" stroke-width="2.6"/>
    </g>
  </svg>`);
}

function ogSvg(): Buffer {
  const grid = Array.from({ length: 26 }, (_, i) => `<line x1="${i * 48}" y1="0" x2="${i * 48}" y2="630" stroke="rgba(255,255,255,0.045)" stroke-width="1"/>`).join('') +
    Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${i * 48}" x2="1200" y2="${i * 48}" stroke="rgba(255,255,255,0.045)" stroke-width="1"/>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <radialGradient id="g1" cx="78%" cy="0%" r="75%">
        <stop offset="0%" stop-color="#1565C0" stop-opacity="0.8"/>
        <stop offset="70%" stop-color="#051838" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx="0%" cy="100%" r="55%">
        <stop offset="0%" stop-color="#F4511E" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#051838" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7FA6E3" stop-opacity="0.1"/>
        <stop offset="55%" stop-color="#7FA6E3" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#F4511E" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="#051838"/>
    ${grid}
    <rect width="1200" height="630" fill="url(#g1)"/>
    <rect width="1200" height="630" fill="url(#g2)"/>
    <path d="M760 520 C860 520 860 410 960 410 C1060 410 1060 300 1180 300" fill="none" stroke="url(#rail)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="760" cy="520" r="7" fill="#7FA6E3"/>
    <circle cx="960" cy="410" r="7" fill="#7FA6E3"/>
    <circle cx="1180" cy="300" r="12" fill="#F4511E"/>
    <g transform="translate(84 76)">
      <rect width="96" height="96" rx="22" fill="#0B3D91" stroke="rgba(255,255,255,0.18)"/>
      <g transform="translate(16 16) scale(1)">
        <path d="M13.5 46.5h6.2c6.4 0 6.4-12.8 13.2-12.8h4.6c6.1 0 6.1-11.2 13.1-11.2" fill="none" stroke="#FFFFFF" stroke-width="4.6" stroke-linecap="round"/>
        <circle cx="13.5" cy="46.5" r="4" fill="#FFFFFF"/>
        <circle cx="33.3" cy="33.7" r="3.1" fill="#FFFFFF"/>
        <circle cx="50.6" cy="22.5" r="5.4" fill="#F4511E" stroke="#FFFFFF" stroke-width="2.6"/>
      </g>
    </g>
    <text x="84" y="250" fill="#FFFFFF" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="92" font-weight="700" letter-spacing="-2">RAKEB</text>
    <text x="84" y="310" fill="#ADC7EF" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="30" letter-spacing="4">EGYPTIAN RAIL TIMETABLES</text>
    <text x="84" y="420" fill="#FFFFFF" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="44" font-weight="600">Know your train, before it leaves.</text>
    <g transform="translate(84 500)">
      <rect width="178" height="44" rx="22" fill="rgba(46,125,50,0.18)" stroke="rgba(46,125,50,0.5)"/>
      <circle cx="24" cy="22" r="5" fill="#4ADE80"/>
      <text x="42" y="29" fill="#BBF7D0" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="17">Officially verified</text>
    </g>
    <g transform="translate(278 500)">
      <rect width="166" height="44" rx="22" fill="rgba(244,81,30,0.16)" stroke="rgba(244,81,30,0.45)"/>
      <circle cx="24" cy="22" r="5" fill="#FB923C"/>
      <text x="42" y="29" fill="#FED7AA" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="17">Rider verified</text>
    </g>
    <g transform="translate(84 578)">
      <text x="0" y="0" fill="#64748B" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="20">rakeb.app — independent timetable platform, not affiliated with ENR</text>
    </g>
  </svg>`);
}

async function main() {
  const out = path.join(root, 'public/icons');
  fs.mkdirSync(out, { recursive: true });
  await sharp(logo).resize(192, 192).png().toFile(path.join(out, 'icon-192.png'));
  await sharp(logo).resize(512, 512).png().toFile(path.join(out, 'icon-512.png'));
  await sharp(logo).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'));
  await sharp(maskableSvg()).resize(512, 512).png().toFile(path.join(out, 'maskable-512.png'));
  await sharp(ogSvg()).png().toFile(path.join(root, 'public/og.png'));
  console.log('Generated icons + og image');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
