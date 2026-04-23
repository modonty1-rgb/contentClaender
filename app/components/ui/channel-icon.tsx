import type { ReactElement } from "react";
import { FaInstagram, FaTiktok, FaXTwitter, FaFacebook, FaYoutube, FaLinkedin, FaSnapchat } from "react-icons/fa6";

type IconEntry = {
  icon: React.ComponentType<{ size?: number }>;
  bg: string;
  color: string;
  label: string;
};

const CHANNELS: Record<string, IconEntry> = {
  instagram: { icon: FaInstagram, bg: "bg-pink-500",  color: "text-white", label: "Instagram" },
  tiktok:    { icon: FaTiktok,    bg: "bg-black",     color: "text-white", label: "TikTok"    },
  x:         { icon: FaXTwitter,  bg: "bg-black",     color: "text-white", label: "X"         },
  facebook:  { icon: FaFacebook,  bg: "bg-blue-600",  color: "text-white", label: "Facebook"  },
  youtube:   { icon: FaYoutube,   bg: "bg-red-600",   color: "text-white", label: "YouTube"   },
  linkedin:  { icon: FaLinkedin,  bg: "bg-sky-700",   color: "text-white", label: "LinkedIn"  },
  snapchat:  { icon: FaSnapchat,  bg: "bg-yellow-400", color: "text-black", label: "Snapchat"  },
};

type Props = {
  channel: string;
  href?: string;
};

export function ChannelIcon({ channel, href }: Props): ReactElement {
  const entry = CHANNELS[channel.toLowerCase()];

  if (!entry) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">
        {channel.slice(0, 2)}
      </span>
    );
  }

  const Icon = entry.icon;
  const hasLink = Boolean(href);

  const inner = (
    <span
      title={hasLink ? `Open ${entry.label}` : entry.label}
      aria-label={entry.label}
      className={[
        "inline-flex h-5 w-5 items-center justify-center rounded shrink-0 transition-opacity",
        entry.bg,
        entry.color,
        hasLink ? "cursor-pointer hover:opacity-80" : "opacity-35 cursor-default",
      ].join(" ")}
    >
      <Icon size={11} />
    </span>
  );

  if (hasLink) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        {inner}
      </a>
    );
  }

  return inner;
}

// Export channel metadata for use in forms
export { CHANNELS };
export type { IconEntry };
