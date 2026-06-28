export type AirlineBrand = {
  key: string;
  name: string;
  iata: string;
  bookingUrl: string;
  checkinUrl: string;
  color: string;
  accent?: string;
  logoText?: string; // texto estilizado para exibir no lugar da logo
};

export const AIRLINES: AirlineBrand[] = [
  // ── Brasileiras ──────────────────────────────────────────────────────────
  {
    key: "gol",
    iata: "G3",
    name: "GOL",
    bookingUrl: "https://b2c.voegol.com.br/minhas-viagens/encontrar-viagem",
    checkinUrl: "https://b2c.voegol.com.br/check-in",
    color: "#FF6B00",
    accent: "#B0B0B0",
  },
  {
    key: "latam",
    iata: "LA",
    name: "LATAM",
    bookingUrl: "https://www.latamairlines.com/br/pt/minhas-viagens",
    checkinUrl: "https://www.latamairlines.com/br/pt/check-in",
    color: "#E40046",
    accent: "#1B0088",
  },
  {
    key: "azul",
    iata: "AD",
    name: "AZUL",
    bookingUrl: "https://www.voeazul.com.br/br/pt/home/reservas.html",
    checkinUrl: "https://www.voeazul.com.br/br/pt/home/check-in.html",
    color: "#005AAB",
  },
  {
    key: "tam",
    iata: "JJ",
    name: "TAM",
    bookingUrl: "https://www.latamairlines.com/br/pt/minhas-viagens",
    checkinUrl: "https://www.latamairlines.com/br/pt/check-in",
    color: "#E40046",
    accent: "#1B0088",
  },
  {
    key: "passaredo",
    iata: "2Z",
    name: "Passaredo",
    bookingUrl: "https://www.voepassaredo.com.br/",
    checkinUrl: "https://www.voepassaredo.com.br/",
    color: "#E3000B",
    accent: "#003087",
  },
  {
    key: "map",
    iata: "7M",
    name: "MAP Linhas Aéreas",
    bookingUrl: "https://www.voeazul.com.br/",
    checkinUrl: "https://www.voeazul.com.br/",
    color: "#005AAB",
  },
  // ── Internacionais — Américas ────────────────────────────────────────────
  {
    key: "american",
    iata: "AA",
    name: "American Airlines",
    bookingUrl: "https://www.aa.com/reservation/retrieveReservationLandingPage.do",
    checkinUrl: "https://www.aa.com/checkin/findItinerary",
    color: "#C8102E",
    accent: "#003087",
  },
  {
    key: "united",
    iata: "UA",
    name: "United Airlines",
    bookingUrl: "https://www.united.com/en/us/manageres/reservations",
    checkinUrl: "https://www.united.com/en/us/checkin",
    color: "#003580",
    accent: "#B3A369",
  },
  {
    key: "delta",
    iata: "DL",
    name: "Delta Air Lines",
    bookingUrl: "https://www.delta.com/us/en/my-trips/overview",
    checkinUrl: "https://www.delta.com/us/en/check-in/overview",
    color: "#C01933",
    accent: "#003A70",
  },
  {
    key: "avianca",
    iata: "AV",
    name: "Avianca",
    bookingUrl: "https://www.avianca.com/br/pt/sua-viagem/",
    checkinUrl: "https://www.avianca.com/br/pt/check-in/",
    color: "#E31837",
    accent: "#003087",
  },
  {
    key: "copa",
    iata: "CM",
    name: "Copa Airlines",
    bookingUrl: "https://www.copaair.com/pt-gs/servicos-de-viagem/minha-viagem/",
    checkinUrl: "https://www.copaair.com/pt-gs/servicos-de-viagem/check-in-online/",
    color: "#00539F",
    accent: "#C8102E",
  },
  {
    key: "aeromexico",
    iata: "AM",
    name: "Aeroméxico",
    bookingUrl: "https://www.aeromexico.com/pt-br/viagens/minha-reserva",
    checkinUrl: "https://www.aeromexico.com/pt-br/check-in",
    color: "#006BB6",
    accent: "#C8102E",
  },
  {
    key: "jetsmart",
    iata: "JA",
    name: "JetSmart",
    bookingUrl: "https://jetsmart.com/br/pt/minhas-reservas/",
    checkinUrl: "https://jetsmart.com/br/pt/check-in/",
    color: "#FFD700",
    accent: "#003087",
  },
  // ── Europa ───────────────────────────────────────────────────────────────
  {
    key: "tap",
    iata: "TP",
    name: "TAP Air Portugal",
    bookingUrl: "https://www.flytap.com/pt-br/gerir-viagem",
    checkinUrl: "https://www.flytap.com/pt-br/check-in",
    color: "#009A44",
    accent: "#C8102E",
  },
  {
    key: "lufthansa",
    iata: "LH",
    name: "Lufthansa",
    bookingUrl: "https://www.lufthansa.com/br/pt/minha-reserva",
    checkinUrl: "https://www.lufthansa.com/br/pt/online-check-in",
    color: "#05164D",
    accent: "#F5A623",
  },
  {
    key: "iberia",
    iata: "IB",
    name: "Iberia",
    bookingUrl: "https://www.iberia.com/br/manage-booking/",
    checkinUrl: "https://www.iberia.com/br/check-in/",
    color: "#C8102E",
    accent: "#F5A623",
  },
  {
    key: "air_france",
    iata: "AF",
    name: "Air France",
    bookingUrl: "https://wwws.airfrance.com.br/informacoes/reservas/minhas-reservas.html",
    checkinUrl: "https://www.airfrance.com.br/BR/pt/local/process/managebooking/manage_booking.htm",
    color: "#002157",
    accent: "#C8102E",
  },
  {
    key: "klm",
    iata: "KL",
    name: "KLM",
    bookingUrl: "https://www.klm.com.br/pt/change-booking/manage-booking.html",
    checkinUrl: "https://www.klm.com.br/pt/check-in.html",
    color: "#00A1DE",
    accent: "#003087",
  },
  {
    key: "british",
    iata: "BA",
    name: "British Airways",
    bookingUrl: "https://www.britishairways.com/travel/managebooking/public/pt_br",
    checkinUrl: "https://www.britishairways.com/travel/olcilandingpageauthreq/public/pt_br",
    color: "#2B5BA8",
    accent: "#C8102E",
  },
  {
    key: "swiss",
    iata: "LX",
    name: "SWISS",
    bookingUrl: "https://www.swiss.com/br/pt/manage-booking",
    checkinUrl: "https://www.swiss.com/br/pt/check-in",
    color: "#C8102E",
    accent: "#000000",
  },
  {
    key: "alitalia",
    iata: "AZ",
    name: "ITA Airways",
    bookingUrl: "https://www.itaairways.com/pt-br/gestao-de-reservas.html",
    checkinUrl: "https://www.itaairways.com/pt-br/check-in.html",
    color: "#009A44",
    accent: "#C8102E",
  },
  {
    key: "turkish",
    iata: "TK",
    name: "Turkish Airlines",
    bookingUrl: "https://www.turkishairlines.com/pt-br/yolculuk-bilgileri/online-islemler/bilet-bul/",
    checkinUrl: "https://www.turkishairlines.com/pt-br/yolculuk-bilgileri/online-check-in/",
    color: "#C8102E",
    accent: "#003087",
  },
  {
    key: "ryanair",
    iata: "FR",
    name: "Ryanair",
    bookingUrl: "https://www.ryanair.com/pt/pt/gerenciar-reserva",
    checkinUrl: "https://www.ryanair.com/pt/pt/check-in",
    color: "#073590",
    accent: "#F6AE2D",
  },
  {
    key: "easyjet",
    iata: "U2",
    name: "easyJet",
    bookingUrl: "https://www.easyjet.com/pt/minhas-viagens",
    checkinUrl: "https://www.easyjet.com/pt/check-in",
    color: "#FF6600",
    accent: "#FFFFFF",
  },
  // ── Oriente Médio / Ásia ─────────────────────────────────────────────────
  {
    key: "emirates",
    iata: "EK",
    name: "Emirates",
    bookingUrl: "https://www.emirates.com/pt/portuguese/manage-booking/",
    checkinUrl: "https://www.emirates.com/pt/portuguese/manage-booking/online-check-in/",
    color: "#C8102E",
    accent: "#CFA85A",
  },
  {
    key: "qatar",
    iata: "QR",
    name: "Qatar Airways",
    bookingUrl: "https://www.qatarairways.com/pt-br/manage-booking.html",
    checkinUrl: "https://www.qatarairways.com/pt-br/manage-booking.html",
    color: "#5C0632",
    accent: "#CFA85A",
  },
  {
    key: "etihad",
    iata: "EY",
    name: "Etihad Airways",
    bookingUrl: "https://www.etihad.com/pt-br/manage/",
    checkinUrl: "https://www.etihad.com/pt-br/manage/check-in",
    color: "#BD8B13",
    accent: "#4B3832",
  },
  {
    key: "singapore",
    iata: "SQ",
    name: "Singapore Airlines",
    bookingUrl: "https://www.singaporeair.com/pt-PT/manage-booking/retrieve-booking/",
    checkinUrl: "https://www.singaporeair.com/pt-PT/manage-booking/check-in/",
    color: "#003087",
    accent: "#C8102E",
  },
  {
    key: "cathay",
    iata: "CX",
    name: "Cathay Pacific",
    bookingUrl: "https://www.cathaypacific.com/cx/pt_BR/manage-booking.html",
    checkinUrl: "https://www.cathaypacific.com/cx/pt_BR/manage-booking/check-in.html",
    color: "#005F6B",
    accent: "#A8A8A8",
  },
  {
    key: "ana",
    iata: "NH",
    name: "ANA",
    bookingUrl: "https://www.ana.co.jp/en/jp/manage-your-trip/",
    checkinUrl: "https://www.ana.co.jp/en/jp/manage-your-trip/check-in/",
    color: "#003087",
    accent: "#C8102E",
  },
  {
    key: "japan",
    iata: "JL",
    name: "Japan Airlines",
    bookingUrl: "https://www.jal.com/en/inter/reservations/",
    checkinUrl: "https://www.jal.com/en/inter/service/check_in/",
    color: "#C8102E",
    accent: "#000000",
  },
  {
    key: "korean",
    iata: "KE",
    name: "Korean Air",
    bookingUrl: "https://www.koreanair.com/pt/travel-info/booking-management",
    checkinUrl: "https://www.koreanair.com/pt/travel-info/check-in",
    color: "#003087",
    accent: "#C8102E",
  },
  // ── América do Sul ───────────────────────────────────────────────────────
  {
    key: "sky",
    iata: "H2",
    name: "Sky Airline",
    bookingUrl: "https://www.skyairline.com/brasil/gerenciar-reserva",
    checkinUrl: "https://www.skyairline.com/brasil/check-in",
    color: "#00AEEF",
    accent: "#003087",
  },
  {
    key: "flybondi",
    iata: "FO",
    name: "Flybondi",
    bookingUrl: "https://www.flybondi.com/",
    checkinUrl: "https://www.flybondi.com/check-in",
    color: "#FF6B00",
    accent: "#FFFFFF",
  },
];

export function getAirlineBrand(companhia?: string): AirlineBrand | null {
  if (!companhia) return null;
  const c = companhia.toLowerCase().trim();
  return (
    AIRLINES.find((b) => c === b.key) ??
    AIRLINES.find((b) => c === b.iata.toLowerCase()) ??
    AIRLINES.find((b) => c.includes(b.key) || b.name.toLowerCase().includes(c)) ??
    null
  );
}

/** Retorna a URL de check-in para a companhia informada */
export function getCheckinUrl(companhia?: string): string | null {
  return getAirlineBrand(companhia)?.checkinUrl ?? null;
}
