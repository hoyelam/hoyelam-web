export type Project = {
  name: string;
  role: string;
  description: string;
  href?: string;
  status?: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  period?: string;
  portfolioTier?: "featured" | "past" | "archive";
  contribution?: string;
};

export const projects: Project[] = [
  {
    name: "DeepL",
    role: "Senior Software Engineer",
    description: "iOS and macOS engineer on translation products at deepl.com.",
    href: "https://www.deepl.com/",
    status: "Current",
    thumbnail: "/images/projects/deepl-logo-blue.svg",
    thumbnailAlt: "DeepL logo",
    period: "2022-present",
    portfolioTier: "featured",
    contribution:
      "Specialized in Apple platform development for language and translation products.",
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
    period: "2026",
    portfolioTier: "featured",
    contribution:
      "Built the macOS app, product, website, and release pipeline.",
  },
  {
    name: "CraftCaption",
    role: "Creator",
    description: "AI captions and hashtags for social posts.",
    href: "https://craftcaption.com/",
    status: "Archived",
    thumbnail:
      "/images/imported/2020/07/four_screens_app_demo-1-ae8d83e6cf.png",
    thumbnailAlt: "CraftCaption app screens",
    period: "2025",
    portfolioTier: "archive",
  },
  {
    name: "Waterfuze",
    role: "Co-founder",
    description: "Helping athletes improve hydration through supplements.",
    href: "https://waterfuze.com/",
    status: "Current",
    thumbnail: "/images/imported/2020/07/image-c16b2eeb88.png",
    thumbnailAlt: "Waterfuze product mix",
    period: "2024-present",
    portfolioTier: "featured",
    contribution:
      "Co-founded the brand and helped bring the product online.",
  },
  {
    name: "Xpensemap",
    role: "Creator",
    description: "AI receipts and invoices accountant.",
    href: "https://xpensemap.com/",
    status: "Archived",
    thumbnail: "/images/imported/2020/07/image-2b5b2e17c5.png",
    thumbnailAlt: "Xpensemap app screens",
    period: "2024",
    portfolioTier: "archive",
  },
  {
    name: "Esportsfort",
    role: "Creator",
    description: "Follow matches and results for esports.",
    href: "https://www.esportsfort.app/",
    status: "Archived",
    thumbnail: "/images/imported/2020/07/image-1-981a975174.png",
    thumbnailAlt: "Esportsfort app screens",
    period: "2023",
    portfolioTier: "archive",
  },
  {
    name: "Websave",
    role: "Creator",
    description: "Save and archive webpages on iOS and iPadOS.",
    href: "https://websave.app/",
    status: "Current",
    thumbnail: "/images/imported/2020/07/image-2-ac840d64ff.png",
    thumbnailAlt: "Websave app screens",
    period: "2026",
    portfolioTier: "featured",
    contribution:
      "Built the iOS and iPadOS app for saving and archiving webpages.",
  },
  {
    name: "Thinkdrop 2",
    role: "Creator",
    description: "Unload thoughts and revisit them later.",
    href: "https://thinkdrop.app/",
    status: "Current",
    thumbnail: "/images/imported/2020/07/image-f93ad6a01d.png",
    thumbnailAlt: "Thinkdrop 2 app screens",
    period: "2024-present",
    portfolioTier: "featured",
    contribution:
      "Rebuilt the thought-capture app and continue to maintain it.",
  },
  {
    name: "Somnox",
    role: "Software Lead / Project Lead",
    description:
      "Sleep robot company where I worked across iOS, software leadership, and product delivery.",
    href: "https://meetsomnox.com/",
    status: "Past",
    thumbnail: "/images/imported/2020/07/Brand-new-companion-app-01ebabef4c.jpeg",
    thumbnailAlt: "Somnox companion app",
    period: "2018-2020",
    portfolioTier: "past",
    contribution:
      "Previously led software work and helped ship connected sleep-tech products.",
  },
  {
    name: "Growrilla",
    role: "Creator",
    description: "Count anything and track progress over time.",
    href: "https://growrilla.app/",
    status: "Archived",
    thumbnail: "/images/imported/2020/07/four_screens_demo-6c03f0964d.png",
    thumbnailAlt: "Growrilla app screens",
    period: "2020-2021",
    portfolioTier: "past",
    contribution:
      "Built and launched the iOS app, subscription flow, widgets, and website.",
  },
  {
    name: "Kowa",
    role: "Creator",
    description: "Wish list app for saving and tracking things you want.",
    href: "https://kowa.app/",
    status: "Archived",
    thumbnail: "/images/imported/2020/07/Wishlists-are-great-d3970c952f.png",
    thumbnailAlt: "Kowa app screen",
    period: "2020",
    portfolioTier: "archive",
  },
  {
    name: "Think Drop",
    role: "Creator",
    description: "Quick thought dropping on your phone.",
    href: "https://thinkdrop.app/",
    status: "Archived",
    thumbnail: "/images/imported/2020/07/image-3-af44044e7c.png",
    thumbnailAlt: "Think Drop app screen",
    period: "2019",
    portfolioTier: "archive",
  },
];
