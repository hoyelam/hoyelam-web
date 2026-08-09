/**
 * Shared allowlist for the public feedback page and the feedback Worker.
 *
 * Repository names are never accepted from a visitor. The Worker resolves a
 * public project id through this list before it calls GitHub.
 */
export const feedbackProjects = [
  {
    id: "loudscript",
    name: "LoudScript",
    aliases: ["loudscript-mac", "loud-script"],
    repository: "hoyelam/LoudScript-mac",
    tokenBinding: "GITHUB_TOKEN_HOYELAM",
  },
  {
    id: "thinkdrop",
    name: "Thinkdrop 2",
    aliases: ["thinkdrop-2", "think-drop", "think-drop-2"],
    repository: "Kin-yee/think-drop",
    tokenBinding: "GITHUB_TOKEN_KIN_YEE",
  },
  {
    id: "websave",
    name: "Websave",
    aliases: ["websnap", "websnap-ios", "websave-ios"],
    repository: "Kin-yee/WebSnap-iOS",
    tokenBinding: "GITHUB_TOKEN_KIN_YEE",
  },
];

export const feedbackStatuses = [
  { id: "review", label: "Under review" },
  { id: "planned", label: "Planned" },
  { id: "in-progress", label: "In progress" },
  { id: "released", label: "Released" },
];
