/**
 * Social brand marks.
 *
 * lucide-react v1 removed brand glyphs, so these are drawn here in the same
 * 24×24 / 1.5-stroke idiom as the rest of the icon set to keep the footer
 * visually consistent.
 */

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function InstagramIcon({ size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M15.5 3h-2.2A4.3 4.3 0 0 0 9 7.3V10H6.5v3.4H9V21h3.4v-7.6h2.6l.5-3.4h-3.1V7.6c0-.7.4-1.1 1.1-1.1h2V3Z" />
    </svg>
  );
}

export function YoutubeIcon({ size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.4 9.6 15 12l-4.6 2.4V9.6Z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="3" />
      <path d="M7 10.5V17" />
      <circle cx="7" cy="7.2" r="0.95" fill="currentColor" stroke="none" />
      <path d="M11 17v-3.6a2.6 2.6 0 0 1 5.2 0V17" />
      <path d="M11 10.5V17" />
    </svg>
  );
}

export function XIcon({ size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M3.5 20.5l1.3-4.2A8.2 8.2 0 1 1 7.9 19.2L3.5 20.5Z" />
      <path d="M9 8.6c.3-.1.6 0 .8.3l.8 1.3c.1.2.1.5 0 .7l-.5.7c-.1.2-.1.4 0 .6.5.8 1.2 1.5 2 2 .2.1.4.1.6 0l.7-.5c.2-.1.5-.2.7 0l1.3.8c.3.2.4.5.3.8-.2.7-.9 1.2-1.7 1.2-2.8-.2-5.2-2.6-5.4-5.4 0-.8.5-1.5 1.2-1.7Z" />
    </svg>
  );
}

export const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  x: XIcon,
  whatsapp: WhatsAppIcon,
} as const;

export type SocialIconName = keyof typeof SOCIAL_ICONS;
