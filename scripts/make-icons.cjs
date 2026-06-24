// Generates brand image assets from the source logos on the Desktop:
//   2.jpg = orb mark  -> favicon (icon.png), apple-icon.png, public/orb.png
//   1.jpg = full logo  -> opengraph-image.png (centered on a 1200x630 black card)
// Run:  node scripts/make-icons.cjs
const sharp = require("sharp");

const ORB = "C:/Users/USER/Desktop/2.jpg";
const LOGO = "C:/Users/USER/Desktop/1.jpg";
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

async function orbTile(size, pad, out) {
  const inner = size - pad * 2;
  const trimmed = await sharp(ORB).trim({ threshold: 20 }).png().toBuffer();
  const mark = await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: BLACK })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BLACK },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out, `${size}x${size}`);
}

async function ogImage(out) {
  const trimmed = await sharp(LOGO).trim({ threshold: 20 }).png().toBuffer();
  const logo = await sharp(trimmed)
    .resize(540, 540, { fit: "contain", background: BLACK })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: BLACK },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out, "1200x630");
}

(async () => {
  await orbTile(256, 30, "src/app/icon.png");
  await orbTile(180, 22, "src/app/apple-icon.png");
  await orbTile(128, 14, "public/orb.png");
  await ogImage("src/app/opengraph-image.png");
  console.log("done");
})();
