export type Project = {
  name: string;
  role: string;
  description: string;
  href?: string;
  status?: string;
  thumbnail?: string;
  thumbnailAlt?: string;
};

export const projects: Project[] = [
  {
    name: "DeepL",
    role: "Full-time job",
    description: "iOS and macOS engineer on translation products at deepl.com.",
    href: "https://www.deepl.com/",
    status: "Current",
  },
  {
    name: "LoudScript",
    role: "Creator",
    description:
      "Mac text-to-speech with selected text, screenshot OCR, and natural voices.",
    href: "https://loudscript.app/",
    status: "Current",
    thumbnail: "/images/projects/loudscript-mac-main-window.png",
    thumbnailAlt: "LoudScript for Mac main window",
  },
  {
    name: "CraftCaption",
    role: "Creator",
    description: "AI captions and hashtags for social posts.",
    href: "https://craftcaption.com/",
    status: "Past",
    thumbnail:
      "/images/imported/2020/07/four_screens_app_demo-1-ae8d83e6cf.png",
    thumbnailAlt: "CraftCaption app screens",
  },
  {
    name: "Waterfuze",
    role: "Co-founder",
    description: "Helping athletes improve hydration through supplements.",
    href: "https://waterfuze.com/",
    status: "Current",
    thumbnail: "/images/imported/2020/07/image-c16b2eeb88.png",
    thumbnailAlt: "Waterfuze product mix",
  },
  {
    name: "Xpensemap",
    role: "Creator",
    description: "AI receipts and invoices accountant.",
    href: "https://xpensemap.com/",
    status: "Past",
    thumbnail: "/images/imported/2020/07/image-2b5b2e17c5.png",
    thumbnailAlt: "Xpensemap app screens",
  },
  {
    name: "Esportsfort",
    role: "Creator",
    description: "Follow matches and results for esports.",
    href: "https://www.esportsfort.app/",
    status: "Past",
    thumbnail: "/images/imported/2020/07/image-1-981a975174.png",
    thumbnailAlt: "Esportsfort app screens",
  },
  {
    name: "Websave",
    role: "Creator",
    description: "Save and archive webpages on iOS and iPadOS.",
    href: "https://websave.app/",
    status: "Current",
    thumbnail: "/images/imported/2020/07/image-2-ac840d64ff.png",
    thumbnailAlt: "Websave app screens",
  },
  {
    name: "Thinkdrop 2",
    role: "Creator",
    description: "Unload thoughts and revisit them later.",
    href: "https://thinkdrop.app/",
    status: "Current",
    thumbnail: "/images/imported/2020/07/image-f93ad6a01d.png",
    thumbnailAlt: "Thinkdrop 2 app screens",
  },
];
