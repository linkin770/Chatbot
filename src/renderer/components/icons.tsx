import type { SVGProps } from 'react';

/**
 * A small, curated set of icons drawn inline as SVG. We keep them on a 16px
 * grid with 1.5px strokes for a refined, Linear-like look. Inlining avoids
 * shipping a separate icon library and lets the colors inherit via
 * `currentColor`.
 */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type IconProps = SVGProps<SVGSVGElement>;

export const IconPlus = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="7" cy="7" r="4" />
    <path d="m10 10 3 3" />
  </svg>
);

export const IconSettings = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M13.5 9.5a5.6 5.6 0 0 0 0-3l1.2-.9-1.2-2-1.4.4a5.6 5.6 0 0 0-2.6-1.5L9 1h-2l-.5 1.5a5.6 5.6 0 0 0-2.6 1.5l-1.4-.4-1.2 2L2.5 6.5a5.6 5.6 0 0 0 0 3l-1.2.9 1.2 2 1.4-.4a5.6 5.6 0 0 0 2.6 1.5L7 15h2l.5-1.5a5.6 5.6 0 0 0 2.6-1.5l1.4.4 1.2-2Z" />
  </svg>
);

export const IconSend = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 8 13 3l-1.6 11.5L7.5 10 2.5 8Z" />
    <path d="m7.5 10 .9 4.5" />
  </svg>
);

export const IconStop = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="5" y="5" width="8" height="8" rx="1.5" />
    <path d="M3 11V4a1.5 1.5 0 0 1 1.5-1.5H11" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m3 8 3 3 7-7" />
  </svg>
);

export const IconRefresh = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9" />
    <path d="M11.5 1.5v3h-3M4.5 14.5v-3h3" />
  </svg>
);

export const IconTrash = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 4.5h10M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
    <path d="M4.5 4.5 5 13a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8.5" />
    <path d="M7 7v5M9 7v5" />
  </svg>
);

export const IconEdit = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M11.5 2.5 13.5 4.5l-8 8H3.5v-2l8-8Z" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const IconChevronRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 4 4 4-4 4" />
  </svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 6 4 4 4-4" />
  </svg>
);

export const IconPanelLeft = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6 3v10" />
  </svg>
);

export const IconPaperclip = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M11.5 6.5 7.2 10.8a2.5 2.5 0 0 1-3.5-3.5L8.4 2.6a1.7 1.7 0 0 1 2.4 2.4L6.1 9.7a.8.8 0 0 1-1.2-1.2L9 4.5" />
  </svg>
);

export const IconSparkle = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 1.5 9.2 5 12.5 6 9.2 7 8 10.5 6.8 7 3.5 6 6.8 5 8 1.5Z" />
    <path d="M12.5 11l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4Z" />
  </svg>
);

export const IconLogo = (p: IconProps) => (
  <svg {...base} {...p} viewBox="0 0 24 24" width={20} height={20}>
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5B5BD6" />
        <stop offset="100%" stopColor="#1a1a1f" />
      </linearGradient>
    </defs>
    <path
      d="M4 4h6a8 8 0 0 1 8 8v0a8 8 0 0 1-8 8H4Z"
      fill="url(#logoGrad)"
      stroke="none"
    />
    <path d="M4 4h6a8 8 0 0 1 8 8v0a8 8 0 0 1-8 8H4Z" stroke="rgba(0,0,0,0.08)" />
    <circle cx="9" cy="12" r="2.5" fill="white" />
  </svg>
);

export const IconArrowUp = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 12V3M4.5 6.5 8 3l3.5 3.5" />
  </svg>
);

export const IconChatBubble = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v5A1.5 1.5 0 0 1 11.5 11H7l-3 2.5V11H4.5A1.5 1.5 0 0 1 3 9.5v-5Z" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="6" r="2.5" />
    <path d="M3 13c.5-2.2 2.5-3.5 5-3.5s4.5 1.3 5 3.5" />
  </svg>
);

export const IconAlert = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3.5M8 10.5v.01" />
  </svg>
);
