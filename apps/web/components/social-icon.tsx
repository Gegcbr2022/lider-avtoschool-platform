import { MessageCircle, Play, Send, UsersRound } from "lucide-react";

type SocialIconProps = {
  id: string;
  label: string;
};

const iconStyles: Record<string, string> = {
  facebook: "bg-[#1877F2]",
  instagram: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4]",
  youtube: "bg-[#FF0000]",
  telegram: "bg-[#229ED9]",
  whatsapp: "bg-[#25D366]"
};

export function SocialIcon({ id, label }: SocialIconProps) {
  const iconClassName = "h-5 w-5";

  return (
    <span
      aria-hidden="true"
      className={`grid h-12 w-12 place-items-center rounded-[16px] text-white shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition duration-200 group-hover:scale-105 ${
        iconStyles[id] ?? "bg-lider-graphite"
      }`}
    >
      {id === "youtube" ? (
        <Play className={`${iconClassName} fill-current`} />
      ) : id === "facebook" || id === "instagram" ? (
        <UsersRound className={iconClassName} />
      ) : id === "telegram" ? (
        <Send className={iconClassName} />
      ) : (
        <MessageCircle className={iconClassName} />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}
