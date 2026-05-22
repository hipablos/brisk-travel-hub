import golLogo from "@/assets/airlines/gol.png";
import latamLogo from "@/assets/airlines/latam.png";
import azulLogo from "@/assets/airlines/azul.png";
import { getAirlineBrand } from "@/lib/airlines";
import { cn } from "@/lib/utils";

const LOGOS: Record<string, string> = {
  gol: golLogo,
  latam: latamLogo,
  azul: azulLogo,
};

export function AirlineLogo({ companhia, className }: { companhia?: string; className?: string }) {
  const brand = getAirlineBrand(companhia);
  if (!brand || !LOGOS[brand.key]) {
    return <div className="text-2xl font-extrabold text-slate-700">{companhia || "Companhia Aérea"}</div>;
  }
  return (
    <img
      src={LOGOS[brand.key]}
      alt={brand.name}
      className={cn("h-12 w-auto object-contain", className)}
    />
  );
}
