import type { APIRoute } from "astro";
import sharp from "sharp";
import portraitDataUrl from "../../../public/images/hoye-lam-x-avatar.jpg?inline";
import { projectLinks } from "../../data/links";

const width = 1200;
const height = 630;
const escapeXml = (text: string) =>
  text.replace(
    /[<>&"']/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );

function imageBytes(dataUrl: string) {
  const payload = dataUrl.match(/^data:image\/[\w.+-]+;base64,(.+)$/s)?.[1];
  if (!payload)
    throw new Error("Sharing images must be imported as inline image assets.");
  return Buffer.from(payload, "base64");
}

async function roundedImage(dataUrl: string, size: number, radius: number) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="100%" height="100%" rx="${radius}" fill="white"/></svg>`,
  );
  return sharp(imageBytes(dataUrl))
    .resize(size, size, { fit: "contain", background: "white" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export const GET: APIRoute = async () => {
  const previews = projectLinks.filter((project) => project.icon).slice(0, 4);
  const labels = previews
    .map((project, index) => {
      const name =
        project.name.length > 19
          ? `${project.name.slice(0, 18)}…`
          : project.name;
      return `<text x="${72 + index * 274}" y="440" font-size="24" font-weight="600">${escapeXml(name)}</text>`;
    })
    .join("");
  const background =
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f7f7f3"/>
    <g font-family="Arial, sans-serif" fill="#171717">
      <text x="216" y="150" font-size="64" font-weight="700" letter-spacing="-2">Hoye Lam</text>
      <text x="216" y="201" font-size="28" fill="#66665f">Software engineer. Indie builder.</text>
      <path d="M72 266H1128" stroke="#ddddd5"/>
      ${labels}
      <text x="72" y="556" font-size="28" font-weight="600">Apps, writing &amp; more</text>
      <text x="1128" y="556" text-anchor="end" font-size="24" fill="#2945b8">hoyelam.com/links</text>
    </g>
  </svg>`);
  const portrait = await roundedImage(portraitDataUrl, 112, 56);
  const logos = await Promise.all(
    previews.map(async (project, index) => ({
      input: await roundedImage(project.icon!.dataUrl, 96, 22),
      left: 72 + index * 274,
      top: 310,
    })),
  );
  const png = await sharp(background)
    .composite([{ input: portrait, left: 72, top: 94 }, ...logos])
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
