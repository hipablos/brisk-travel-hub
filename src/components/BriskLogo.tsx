import logoColor from "@/assets/brisk-logo.png";
import logoWhite from "@/assets/brisk-logo-white.png";
import logoBlue from "@/assets/brisk-logo-blue.png";
import { cn } from "@/lib/utils";

type Variant = "color" | "white" | "blue";

export function BriskLogo({
  variant = "color",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const src = variant === "white" ? logoWhite : variant === "blue" ? logoBlue : logoColor;
  return (
    <img
      src={src}
      alt="Brisk Viagens"
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}
