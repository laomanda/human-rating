import { getInitials } from "@/features/dashboard/formatters";

type ProfileAvatarSize =
  | "sm"
  | "md"
  | "lg"
  | "xl";

type ProfileAvatarProps = {
  avatarUrl: string | null;
  fullName: string;
  size?: ProfileAvatarSize;
  className?: string;
};

const SIZE_CLASSES: Record<
  ProfileAvatarSize,
  string
> = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-16 w-16 rounded-2xl text-lg",
  lg: "h-24 w-24 rounded-3xl text-2xl",
  xl: "h-32 w-32 rounded-[2rem] text-3xl",
};

export function ProfileAvatar({
  avatarUrl,
  fullName,
  size = "md",
  className = "",
}: ProfileAvatarProps) {
  const initials =
    getInitials(fullName) || "H";

  return (
    <div
      role="img"
      aria-label={`Foto profil ${fullName}`}
      className={[
        "shrink-0 overflow-hidden border border-white/10 bg-white/[0.04]",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    >
      {avatarUrl ? (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              `url(${JSON.stringify(
                avatarUrl,
              )})`,
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-300">
          {initials}
        </div>
      )}
    </div>
  );
}