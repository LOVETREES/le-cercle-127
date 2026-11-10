// Lieux de naissance intégrés à l'application (aucun service en ligne) : nom, latitude, longitude, fuseau IANA.
// Le fuseau sert à convertir l'heure locale de naissance en temps universel, heure d'été historique comprise.
export type Ville = { name: string; lat: number; lon: number; tz: string };

const V = (name: string, lat: number, lon: number, tz = 'Europe/Paris'): Ville => ({ name, lat, lon, tz });

export const VILLES: Ville[] = [
  // France métropolitaine
  V('Paris', 48.857, 2.352), V('Marseille', 43.296, 5.37), V('Lyon', 45.764, 4.836), V('Toulouse', 43.605, 1.444),
  V('Nice', 43.71, 7.262), V('Nantes', 47.218, -1.554), V('Montpellier', 43.611, 3.877), V('Strasbourg', 48.573, 7.752),
  V('Bordeaux', 44.838, -0.579), V('Lille', 50.629, 3.057), V('Rennes', 48.117, -1.678), V('Reims', 49.258, 4.032),
  V('Toulon', 43.124, 5.928), V('Saint-Étienne', 45.44, 4.387), V('Le Havre', 49.494, 0.108), V('Grenoble', 45.188, 5.724),
  V('Dijon', 47.322, 5.041), V('Angers', 47.478, -0.563), V('Nîmes', 43.837, 4.36), V('Clermont-Ferrand', 45.778, 3.087),
  V('Aix-en-Provence', 43.53, 5.447), V('Brest', 48.39, -4.486), V('Tours', 47.394, 0.685), V('Amiens', 49.894, 2.296),
  V('Limoges', 45.834, 1.261), V('Perpignan', 42.699, 2.895), V('Metz', 49.12, 6.176), V('Besançon', 47.238, 6.024),
  V('Orléans', 47.903, 1.909), V('Rouen', 49.443, 1.1), V('Mulhouse', 47.75, 7.336), V('Caen', 49.183, -0.371),
  V('Nancy', 48.692, 6.184), V('Avignon', 43.949, 4.806), V('Poitiers', 46.58, 0.34), V('Pau', 43.295, -0.371),
  V('La Rochelle', 46.16, -1.151), V('Béziers', 43.344, 3.216), V('Lodève', 43.731, 3.319), V('Sète', 43.403, 3.697),
  V('Narbonne', 43.184, 3.004), V('Carcassonne', 43.213, 2.351), V('Albi', 43.929, 2.148), V('Rodez', 44.35, 2.575),
  V('Millau', 44.098, 3.078), V('Alès', 44.125, 4.081), V('Bayonne', 43.493, -1.475), V('Annecy', 45.899, 6.129),
  V('Chambéry', 45.564, 5.918), V('Valence', 44.933, 4.892), V('Le Mans', 48.006, 0.199), V('Troyes', 48.297, 4.074),
  V('Ajaccio', 41.919, 8.739), V('Bastia', 42.697, 9.451),
  // Outre-mer
  V('Fort-de-France', 14.616, -61.059, 'America/Martinique'), V('Pointe-à-Pitre', 16.241, -61.533, 'America/Guadeloupe'),
  V('Cayenne', 4.922, -52.313, 'America/Cayenne'), V('Saint-Denis (La Réunion)', -20.882, 55.451, 'Indian/Reunion'),
  V('Mamoudzou', -12.781, 45.228, 'Indian/Mayotte'), V('Nouméa', -22.276, 166.458, 'Pacific/Noumea'),
  V('Papeete', -17.535, -149.569, 'Pacific/Tahiti'),
  // Pays francophones
  V('Bruxelles', 50.85, 4.352, 'Europe/Brussels'), V('Liège', 50.633, 5.567, 'Europe/Brussels'), V('Genève', 46.204, 6.143, 'Europe/Zurich'),
  V('Lausanne', 46.52, 6.633, 'Europe/Zurich'), V('Luxembourg', 49.611, 6.13, 'Europe/Luxembourg'), V('Monaco', 43.738, 7.425, 'Europe/Monaco'),
  V('Montréal', 45.502, -73.567, 'America/Toronto'), V('Québec', 46.813, -71.208, 'America/Toronto'),
  V('Alger', 36.754, 3.059, 'Africa/Algiers'), V('Oran', 35.697, -0.633, 'Africa/Algiers'), V('Constantine', 36.365, 6.615, 'Africa/Algiers'),
  V('Tunis', 36.806, 10.181, 'Africa/Tunis'), V('Casablanca', 33.573, -7.589, 'Africa/Casablanca'), V('Rabat', 34.02, -6.841, 'Africa/Casablanca'),
  V('Marrakech', 31.629, -7.981, 'Africa/Casablanca'), V('Dakar', 14.716, -17.467, 'Africa/Dakar'), V('Abidjan', 5.36, -4.008, 'Africa/Abidjan'),
  V('Bamako', 12.639, -8.003, 'Africa/Bamako'), V('Kinshasa', -4.441, 15.266, 'Africa/Kinshasa'), V('Douala', 4.051, 9.768, 'Africa/Douala'),
  V('Yaoundé', 3.848, 11.502, 'Africa/Douala'), V('Beyrouth', 33.894, 35.502, 'Asia/Beirut'), V('Port-au-Prince', 18.594, -72.307, 'America/Port-au-Prince'),
  // Monde
  V('Londres', 51.507, -0.128, 'Europe/London'), V('Madrid', 40.417, -3.704, 'Europe/Madrid'), V('Barcelone', 41.385, 2.173, 'Europe/Madrid'),
  V('Lisbonne', 38.722, -9.139, 'Europe/Lisbon'), V('Rome', 41.903, 12.496, 'Europe/Rome'), V('Milan', 45.464, 9.19, 'Europe/Rome'),
  V('Berlin', 52.52, 13.405, 'Europe/Berlin'), V('Amsterdam', 52.368, 4.904, 'Europe/Amsterdam'), V('Varsovie', 52.23, 21.012, 'Europe/Warsaw'),
  V('Istanbul', 41.008, 28.978, 'Europe/Istanbul'), V('Le Caire', 30.044, 31.236, 'Africa/Cairo'), V('New York', 40.713, -74.006, 'America/New_York'),
  V('Los Angeles', 34.052, -118.244, 'America/Los_Angeles'), V('Mexico', 19.433, -99.133, 'America/Mexico_City'),
  V('São Paulo', -23.551, -46.633, 'America/Sao_Paulo'), V('Buenos Aires', -34.604, -58.382, 'America/Argentina/Buenos_Aires'),
  V('Tokyo', 35.676, 139.65, 'Asia/Tokyo'), V('Pékin', 39.904, 116.407, 'Asia/Shanghai'), V('Bombay', 19.076, 72.878, 'Asia/Kolkata'),
  V('Sydney', -33.869, 151.209, 'Australia/Sydney'),
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export function searchVilles(q: string, max = 6): Ville[] {
  const n = norm(q.trim());
  if (n.length < 2) return [];
  return VILLES.filter((v) => norm(v.name).startsWith(n)).concat(VILLES.filter((v) => !norm(v.name).startsWith(n) && norm(v.name).includes(n))).slice(0, max);
}
export const villeByName = (name?: string) => VILLES.find((v) => v.name === name);
