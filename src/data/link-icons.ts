import loudscriptImage from "../assets/links/loudscript.png";
import loudscriptDataUrl from "../assets/links/loudscript.png?inline";
import thinkdropImage from "../assets/links/thinkdrop.png";
import thinkdropDataUrl from "../assets/links/thinkdrop.png?inline";
import waterfuzeImage from "../assets/links/waterfuze.png";
import waterfuzeDataUrl from "../assets/links/waterfuze.png?inline";
import websaveImage from "../assets/links/websave.png";
import websaveDataUrl from "../assets/links/websave.png?inline";

// Astro optimizes the page images; the static sharing image uses the same originals.
export const linkIcons = {
  loudscript: { image: loudscriptImage, dataUrl: loudscriptDataUrl },
  thinkdrop: { image: thinkdropImage, dataUrl: thinkdropDataUrl },
  waterfuze: { image: waterfuzeImage, dataUrl: waterfuzeDataUrl },
  websave: { image: websaveImage, dataUrl: websaveDataUrl },
};

export type LinkIcon = (typeof linkIcons)[keyof typeof linkIcons];
