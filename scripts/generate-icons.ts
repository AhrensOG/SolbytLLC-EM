import sharp from "sharp";

const WALLET_PATHS = [
  "M21 12V7H5a2 2 0 0 1 0-4h14v4",
  "M3 5v14a2 2 0 0 0 2 2h16v-5",
  "M18 12a2 2 0 0 0 0 4h4v-4Z",
];

function iconSvg(size: number, { rounded }: { rounded: boolean }): string {
  const pad = Math.round(size * 0.245);
  const inner = size - pad * 2;
  const scale = inner / 24;
  const radius = rounded ? Math.round(size * 0.223) : 0;
  const paths = WALLET_PATHS.map((d) => `<path d="${d}"/>`).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#9333ea"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>`;
}

async function main() {
  await sharp(Buffer.from(iconSvg(180, { rounded: false })))
    .png()
    .toFile("app/apple-icon.png");
  await sharp(Buffer.from(iconSvg(512, { rounded: true })))
    .png()
    .toFile("app/icon.png");
  console.log(
    "Icons generated: app/apple-icon.png (180x180), app/icon.png (512x512)",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
