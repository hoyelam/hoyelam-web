// Phosphor icons (MIT), duotone weight, inlined at build time.
import chat from "@phosphor-icons/core/assets/duotone/chat-circle-dots-duotone.svg?raw";
import house from "@phosphor-icons/core/assets/duotone/house-duotone.svg?raw";
import moon from "@phosphor-icons/core/assets/duotone/moon-stars-duotone.svg?raw";
import pen from "@phosphor-icons/core/assets/duotone/pen-nib-duotone.svg?raw";
import rocket from "@phosphor-icons/core/assets/duotone/rocket-launch-duotone.svg?raw";
import rss from "@phosphor-icons/core/assets/duotone/rss-simple-duotone.svg?raw";
import sun from "@phosphor-icons/core/assets/duotone/sun-duotone.svg?raw";
import user from "@phosphor-icons/core/assets/duotone/user-circle-duotone.svg?raw";

const icons = { chat, house, moon, pen, rocket, rss, sun, user };

export type IconName = keyof typeof icons;

export function iconSvg(name: IconName, className?: string) {
  const attributes = `aria-hidden="true" focusable="false"${className ? ` class="${className}"` : ""}`;
  return icons[name].replace("<svg ", `<svg ${attributes} `);
}
