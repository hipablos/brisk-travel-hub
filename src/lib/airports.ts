export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string;
};

// Curated worldwide dataset of major airports (IATA).
export const AIRPORTS: Airport[] = [
  // Brasil
  { iata: "GRU", name: "Guarulhos Intl.", city: "São Paulo", country: "Brasil" },
  { iata: "CGH", name: "Congonhas", city: "São Paulo", country: "Brasil" },
  { iata: "VCP", name: "Viracopos", city: "Campinas", country: "Brasil" },
  { iata: "GIG", name: "Galeão", city: "Rio de Janeiro", country: "Brasil" },
  { iata: "SDU", name: "Santos Dumont", city: "Rio de Janeiro", country: "Brasil" },
  { iata: "BSB", name: "Pres. Juscelino Kubitschek", city: "Brasília", country: "Brasil" },
  { iata: "CNF", name: "Tancredo Neves (Confins)", city: "Belo Horizonte", country: "Brasil" },
  { iata: "PLU", name: "Pampulha", city: "Belo Horizonte", country: "Brasil" },
  { iata: "FOR", name: "Pinto Martins", city: "Fortaleza", country: "Brasil" },
  { iata: "REC", name: "Guararapes", city: "Recife", country: "Brasil" },
  { iata: "SSA", name: "Dep. Luís Eduardo Magalhães", city: "Salvador", country: "Brasil" },
  { iata: "POA", name: "Salgado Filho", city: "Porto Alegre", country: "Brasil" },
  { iata: "CWB", name: "Afonso Pena", city: "Curitiba", country: "Brasil" },
  { iata: "FLN", name: "Hercílio Luz", city: "Florianópolis", country: "Brasil" },
  { iata: "NAT", name: "Aluízio Alves", city: "Natal", country: "Brasil" },
  { iata: "MCZ", name: "Zumbi dos Palmares", city: "Maceió", country: "Brasil" },
  { iata: "AJU", name: "Santa Maria", city: "Aracaju", country: "Brasil" },
  { iata: "JPA", name: "Castro Pinto", city: "João Pessoa", country: "Brasil" },
  { iata: "THE", name: "Senador Petrônio Portella", city: "Teresina", country: "Brasil" },
  { iata: "SLZ", name: "Marechal Cunha Machado", city: "São Luís", country: "Brasil" },
  { iata: "BEL", name: "Val de Cans", city: "Belém", country: "Brasil" },
  { iata: "MAO", name: "Eduardo Gomes", city: "Manaus", country: "Brasil" },
  { iata: "CGB", name: "Marechal Rondon", city: "Cuiabá", country: "Brasil" },
  { iata: "CGR", name: "Campo Grande Intl.", city: "Campo Grande", country: "Brasil" },
  { iata: "GYN", name: "Santa Genoveva", city: "Goiânia", country: "Brasil" },
  { iata: "VIX", name: "Eurico de Aguiar Salles", city: "Vitória", country: "Brasil" },
  { iata: "IGU", name: "Foz do Iguaçu Intl.", city: "Foz do Iguaçu", country: "Brasil" },
  { iata: "NVT", name: "Navegantes Intl.", city: "Navegantes", country: "Brasil" },
  { iata: "PMW", name: "Palmas Intl.", city: "Palmas", country: "Brasil" },
  { iata: "MGF", name: "Maringá Regional", city: "Maringá", country: "Brasil" },
  { iata: "LDB", name: "Londrina", city: "Londrina", country: "Brasil" },
  { iata: "RAO", name: "Leite Lopes", city: "Ribeirão Preto", country: "Brasil" },
  { iata: "SJP", name: "São José do Rio Preto", city: "São José do Rio Preto", country: "Brasil" },
  { iata: "UDI", name: "Tubinambás", city: "Uberlândia", country: "Brasil" },
  { iata: "JDO", name: "Orlando Bezerra", city: "Juazeiro do Norte", country: "Brasil" },
  { iata: "PNZ", name: "Senador Nilo Coelho", city: "Petrolina", country: "Brasil" },
  { iata: "IOS", name: "Bahia-Jorge Amado", city: "Ilhéus", country: "Brasil" },
  { iata: "BPS", name: "Porto Seguro", city: "Porto Seguro", country: "Brasil" },
  // EUA
  { iata: "JFK", name: "John F. Kennedy Intl.", city: "Nova York", country: "EUA" },
  { iata: "LGA", name: "LaGuardia", city: "Nova York", country: "EUA" },
  { iata: "EWR", name: "Newark Liberty", city: "Newark", country: "EUA" },
  { iata: "MIA", name: "Miami Intl.", city: "Miami", country: "EUA" },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood", city: "Fort Lauderdale", country: "EUA" },
  { iata: "MCO", name: "Orlando Intl.", city: "Orlando", country: "EUA" },
  { iata: "TPA", name: "Tampa Intl.", city: "Tampa", country: "EUA" },
  { iata: "ATL", name: "Hartsfield-Jackson", city: "Atlanta", country: "EUA" },
  { iata: "LAX", name: "Los Angeles Intl.", city: "Los Angeles", country: "EUA" },
  { iata: "SFO", name: "San Francisco Intl.", city: "São Francisco", country: "EUA" },
  { iata: "SAN", name: "San Diego Intl.", city: "San Diego", country: "EUA" },
  { iata: "LAS", name: "Harry Reid Intl.", city: "Las Vegas", country: "EUA" },
  { iata: "PHX", name: "Sky Harbor", city: "Phoenix", country: "EUA" },
  { iata: "DEN", name: "Denver Intl.", city: "Denver", country: "EUA" },
  { iata: "ORD", name: "O'Hare Intl.", city: "Chicago", country: "EUA" },
  { iata: "MDW", name: "Midway", city: "Chicago", country: "EUA" },
  { iata: "DFW", name: "Dallas/Fort Worth Intl.", city: "Dallas", country: "EUA" },
  { iata: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "EUA" },
  { iata: "BOS", name: "Logan Intl.", city: "Boston", country: "EUA" },
  { iata: "IAD", name: "Dulles Intl.", city: "Washington", country: "EUA" },
  { iata: "DCA", name: "Reagan National", city: "Washington", country: "EUA" },
  { iata: "SEA", name: "Seattle-Tacoma", city: "Seattle", country: "EUA" },
  { iata: "PHL", name: "Philadelphia Intl.", city: "Filadélfia", country: "EUA" },
  { iata: "DTW", name: "Detroit Metropolitan", city: "Detroit", country: "EUA" },
  { iata: "MSP", name: "Minneapolis-St Paul", city: "Mineápolis", country: "EUA" },
  { iata: "CLT", name: "Charlotte Douglas", city: "Charlotte", country: "EUA" },
  { iata: "SLC", name: "Salt Lake City Intl.", city: "Salt Lake City", country: "EUA" },
  { iata: "HNL", name: "Daniel K. Inouye", city: "Honolulu", country: "EUA" },
  // Canadá / México
  { iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canadá" },
  { iata: "YVR", name: "Vancouver Intl.", city: "Vancouver", country: "Canadá" },
  { iata: "YUL", name: "Montréal-Trudeau", city: "Montreal", country: "Canadá" },
  { iata: "YYC", name: "Calgary Intl.", city: "Calgary", country: "Canadá" },
  { iata: "MEX", name: "Benito Juárez", city: "Cidade do México", country: "México" },
  { iata: "CUN", name: "Cancún Intl.", city: "Cancún", country: "México" },
  { iata: "GDL", name: "Guadalajara Intl.", city: "Guadalajara", country: "México" },
  { iata: "MTY", name: "Monterrey Intl.", city: "Monterrey", country: "México" },
  { iata: "SJD", name: "Los Cabos Intl.", city: "Los Cabos", country: "México" },
  // América do Sul
  { iata: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "Argentina" },
  { iata: "AEP", name: "Jorge Newbery", city: "Buenos Aires", country: "Argentina" },
  { iata: "MVD", name: "Carrasco", city: "Montevidéu", country: "Uruguai" },
  { iata: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "Chile" },
  { iata: "LIM", name: "Jorge Chávez", city: "Lima", country: "Peru" },
  { iata: "BOG", name: "El Dorado", city: "Bogotá", country: "Colômbia" },
  { iata: "CTG", name: "Rafael Núñez", city: "Cartagena", country: "Colômbia" },
  { iata: "UIO", name: "Mariscal Sucre", city: "Quito", country: "Equador" },
  { iata: "GYE", name: "José Joaquín de Olmedo", city: "Guayaquil", country: "Equador" },
  { iata: "CCS", name: "Maiquetía", city: "Caracas", country: "Venezuela" },
  { iata: "ASU", name: "Silvio Pettirossi", city: "Assunção", country: "Paraguai" },
  { iata: "LPB", name: "El Alto", city: "La Paz", country: "Bolívia" },
  // Europa
  { iata: "LHR", name: "Heathrow", city: "Londres", country: "Reino Unido" },
  { iata: "LGW", name: "Gatwick", city: "Londres", country: "Reino Unido" },
  { iata: "STN", name: "Stansted", city: "Londres", country: "Reino Unido" },
  { iata: "MAN", name: "Manchester", city: "Manchester", country: "Reino Unido" },
  { iata: "EDI", name: "Edinburgh", city: "Edimburgo", country: "Reino Unido" },
  { iata: "DUB", name: "Dublin", city: "Dublin", country: "Irlanda" },
  { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "França" },
  { iata: "ORY", name: "Orly", city: "Paris", country: "França" },
  { iata: "NCE", name: "Côte d'Azur", city: "Nice", country: "França" },
  { iata: "MRS", name: "Marseille Provence", city: "Marselha", country: "França" },
  { iata: "AMS", name: "Schiphol", city: "Amsterdã", country: "Holanda" },
  { iata: "BRU", name: "Brussels", city: "Bruxelas", country: "Bélgica" },
  { iata: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Alemanha" },
  { iata: "MUC", name: "Munich", city: "Munique", country: "Alemanha" },
  { iata: "BER", name: "Berlin Brandenburg", city: "Berlim", country: "Alemanha" },
  { iata: "DUS", name: "Düsseldorf", city: "Düsseldorf", country: "Alemanha" },
  { iata: "HAM", name: "Hamburg", city: "Hamburgo", country: "Alemanha" },
  { iata: "MAD", name: "Madrid-Barajas", city: "Madri", country: "Espanha" },
  { iata: "BCN", name: "Barcelona-El Prat", city: "Barcelona", country: "Espanha" },
  { iata: "AGP", name: "Málaga-Costa del Sol", city: "Málaga", country: "Espanha" },
  { iata: "PMI", name: "Palma de Mallorca", city: "Palma", country: "Espanha" },
  { iata: "LIS", name: "Humberto Delgado", city: "Lisboa", country: "Portugal" },
  { iata: "OPO", name: "Francisco Sá Carneiro", city: "Porto", country: "Portugal" },
  { iata: "FCO", name: "Fiumicino", city: "Roma", country: "Itália" },
  { iata: "MXP", name: "Malpensa", city: "Milão", country: "Itália" },
  { iata: "LIN", name: "Linate", city: "Milão", country: "Itália" },
  { iata: "VCE", name: "Marco Polo", city: "Veneza", country: "Itália" },
  { iata: "NAP", name: "Napoli", city: "Nápoles", country: "Itália" },
  { iata: "ZRH", name: "Zürich", city: "Zurique", country: "Suíça" },
  { iata: "GVA", name: "Genève", city: "Genebra", country: "Suíça" },
  { iata: "VIE", name: "Vienna", city: "Viena", country: "Áustria" },
  { iata: "CPH", name: "Copenhagen", city: "Copenhague", country: "Dinamarca" },
  { iata: "ARN", name: "Arlanda", city: "Estocolmo", country: "Suécia" },
  { iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Noruega" },
  { iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinque", country: "Finlândia" },
  { iata: "WAW", name: "Chopin", city: "Varsóvia", country: "Polônia" },
  { iata: "PRG", name: "Václav Havel", city: "Praga", country: "República Tcheca" },
  { iata: "BUD", name: "Ferenc Liszt", city: "Budapeste", country: "Hungria" },
  { iata: "ATH", name: "Eleftherios Venizelos", city: "Atenas", country: "Grécia" },
  { iata: "IST", name: "Istanbul", city: "Istambul", country: "Turquia" },
  { iata: "SAW", name: "Sabiha Gökçen", city: "Istambul", country: "Turquia" },
  { iata: "SVO", name: "Sheremetyevo", city: "Moscou", country: "Rússia" },
  { iata: "DME", name: "Domodedovo", city: "Moscou", country: "Rússia" },
  // Oriente Médio / África
  { iata: "DXB", name: "Dubai Intl.", city: "Dubai", country: "Emirados Árabes Unidos" },
  { iata: "AUH", name: "Abu Dhabi Intl.", city: "Abu Dhabi", country: "Emirados Árabes Unidos" },
  { iata: "DOH", name: "Hamad Intl.", city: "Doha", country: "Catar" },
  { iata: "RUH", name: "King Khalid Intl.", city: "Riade", country: "Arábia Saudita" },
  { iata: "JED", name: "King Abdulaziz", city: "Jeddah", country: "Arábia Saudita" },
  { iata: "TLV", name: "Ben Gurion", city: "Tel Aviv", country: "Israel" },
  { iata: "CAI", name: "Cairo Intl.", city: "Cairo", country: "Egito" },
  { iata: "JNB", name: "OR Tambo", city: "Joanesburgo", country: "África do Sul" },
  { iata: "CPT", name: "Cape Town Intl.", city: "Cidade do Cabo", country: "África do Sul" },
  { iata: "CMN", name: "Mohammed V", city: "Casablanca", country: "Marrocos" },
  { iata: "ADD", name: "Bole", city: "Adis Abeba", country: "Etiópia" },
  { iata: "NBO", name: "Jomo Kenyatta", city: "Nairóbi", country: "Quênia" },
  // Ásia / Oceania
  { iata: "HND", name: "Haneda", city: "Tóquio", country: "Japão" },
  { iata: "NRT", name: "Narita", city: "Tóquio", country: "Japão" },
  { iata: "KIX", name: "Kansai Intl.", city: "Osaka", country: "Japão" },
  { iata: "ICN", name: "Incheon Intl.", city: "Seul", country: "Coreia do Sul" },
  { iata: "GMP", name: "Gimpo", city: "Seul", country: "Coreia do Sul" },
  { iata: "PEK", name: "Beijing Capital", city: "Pequim", country: "China" },
  { iata: "PKX", name: "Beijing Daxing", city: "Pequim", country: "China" },
  { iata: "PVG", name: "Shanghai Pudong", city: "Xangai", country: "China" },
  { iata: "SHA", name: "Shanghai Hongqiao", city: "Xangai", country: "China" },
  { iata: "CAN", name: "Guangzhou Baiyun", city: "Cantão", country: "China" },
  { iata: "HKG", name: "Hong Kong Intl.", city: "Hong Kong", country: "China" },
  { iata: "TPE", name: "Taoyuan", city: "Taipé", country: "Taiwan" },
  { iata: "SIN", name: "Changi", city: "Singapura", country: "Singapura" },
  { iata: "KUL", name: "Kuala Lumpur Intl.", city: "Kuala Lumpur", country: "Malásia" },
  { iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Tailândia" },
  { iata: "DMK", name: "Don Mueang", city: "Bangkok", country: "Tailândia" },
  { iata: "HKT", name: "Phuket Intl.", city: "Phuket", country: "Tailândia" },
  { iata: "CGK", name: "Soekarno-Hatta", city: "Jacarta", country: "Indonésia" },
  { iata: "DPS", name: "Ngurah Rai", city: "Bali", country: "Indonésia" },
  { iata: "MNL", name: "Ninoy Aquino", city: "Manila", country: "Filipinas" },
  { iata: "SGN", name: "Tan Son Nhat", city: "Ho Chi Minh", country: "Vietnã" },
  { iata: "HAN", name: "Noi Bai", city: "Hanói", country: "Vietnã" },
  { iata: "DEL", name: "Indira Gandhi", city: "Nova Délhi", country: "Índia" },
  { iata: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "Índia" },
  { iata: "BLR", name: "Kempegowda", city: "Bangalore", country: "Índia" },
  { iata: "MAA", name: "Chennai Intl.", city: "Chennai", country: "Índia" },
  { iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Austrália" },
  { iata: "MEL", name: "Melbourne Tullamarine", city: "Melbourne", country: "Austrália" },
  { iata: "BNE", name: "Brisbane", city: "Brisbane", country: "Austrália" },
  { iata: "PER", name: "Perth", city: "Perth", country: "Austrália" },
  { iata: "AKL", name: "Auckland", city: "Auckland", country: "Nova Zelândia" },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function searchAirports(query: string, limit = 8): Airport[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const scored: { a: Airport; score: number }[] = [];
  for (const a of AIRPORTS) {
    const iata = a.iata.toLowerCase();
    const city = normalize(a.city);
    const name = normalize(a.name);
    const country = normalize(a.country);
    let score = 0;
    if (iata === q) score = 1000;
    else if (iata.startsWith(q)) score = 800;
    else if (city.startsWith(q)) score = 600;
    else if (city.includes(q)) score = 400;
    else if (name.includes(q)) score = 300;
    else if (country.includes(q)) score = 100;
    if (score > 0) scored.push({ a, score });
  }
  return scored.sort((x, y) => y.score - x.score).slice(0, limit).map((s) => s.a);
}

export function formatAirport(a: Airport): string {
  return `${a.iata} - ${a.city} (${a.name})`;
}
