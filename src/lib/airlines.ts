export type AirlineBrand = {
  key: string;
  name: string;
  bookingUrl: string;
  /** brand color used for the stylized text logo */
  color: string;
  /** optional secondary accent (used as a second letter color) */
  accent?: string;
};

const BRANDS: AirlineBrand[] = [
  {
    key: "gol",
    name: "GOL",
    bookingUrl: "https://b2c.voegol.com.br/minhas-viagens/encontrar-viagem",
    color: "#FF6B00",
    accent: "#B0B0B0",
  },
  {
    key: "latam",
    name: "LATAM",
    bookingUrl: "https://www.latamairlines.com/br/pt/minhas-viagens",
    color: "#E40046",
    accent: "#1B0088",
  },
  {
    key: "azul",
    name: "AZUL",
    bookingUrl: "https://www.voeazul.com.br/br/pt/home/reservas.html",
    color: "#005AAB",
  },
];

export function getAirlineBrand(companhia?: string): AirlineBrand | null {
  if (!companhia) return null;
  const c = companhia.toLowerCase();
  return BRANDS.find((b) => c.includes(b.key)) ?? null;
}
