import sharp from "sharp";

const WALLET_PATHS = [
  "M21 12V7H5a2 2 0 0 1 0-4h14v4",
  "M3 5v14a2 2 0 0 0 2 2h16v-5",
  "M18 12a2 2 0 0 0 0 4h4v-4Z",
];

const SPLASH_DEVICES = [
  { file: "640x1136", width: 640, height: 1136 },
  { file: "750x1334", width: 750, height: 1334 },
  { file: "828x1792", width: 828, height: 1792 },
  { file: "1125x2436", width: 1125, height: 2436 },
  { file: "1170x2532", width: 1170, height: 2532 },
  { file: "1179x2556", width: 1179, height: 2556 },
  { file: "1284x2778", width: 1284, height: 2778 },
  { file: "1290x2796", width: 1290, height: 2796 },
  { file: "1536x2048", width: 1536, height: 2048 },
  { file: "2048x2732", width: 2048, height: 2732 },
];

function walletGlyph(): string {
  return WALLET_PATHS.map((d) => `<path d="${d}"/>`).join("");
}

function iconSvg(size: number, { rounded }: { rounded: boolean }): string {
  const pad = Math.round(size * 0.245);
  const inner = size - pad * 2;
  const scale = inner / 24;
  const radius = rounded ? Math.round(size * 0.223) : 0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#9333ea"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${walletGlyph()}</g>
</svg>`;
}

function splashSvg(width: number, height: number): string {
  const box = Math.round(Math.min(width, height) * 0.22);
  const pad = Math.round(box * 0.245);
  const inner = box - pad * 2;
  const scale = inner / 24;
  const radius = Math.round(box * 0.223);
  const x = Math.round((width - box) / 2);
  const y = Math.round((height - box) / 2);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0b0612"/>
  <rect x="${x}" y="${y}" width="${box}" height="${box}" rx="${radius}" fill="#9333ea"/>
  <g transform="translate(${x + pad} ${y + pad}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${walletGlyph()}</g>
</svg>`;
}

async function main() {
  await sharp(Buffer.from(iconSvg(180, { rounded: false })))
    .png()
    .toFile("app/apple-icon.png");
  await sharp(Buffer.from(iconSvg(512, { rounded: true })))
    .png()
    .toFile("app/icon.png");

  for (const device of SPLASH_DEVICES) {
    await sharp(Buffer.from(splashSvg(device.width, device.height)))
      .png()
      .toFile(`public/apple-splash-${device.file}.png`);
  }

  console.log(
    `Icons generated: app/apple-icon.png (180x180), app/icon.png (512x512), ${SPLASH_DEVICES.length} splash screens in public/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
