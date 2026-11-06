export type VehicleType =
  | 'villamos_mozdony'
  | 'dizel_mozdony'
  | 'motorvonat'
  | 'szemelykocsi'
  | 'teherkocsi';

export type VehicleStatus = 'aktiv' | 'fenntartott' | 'felujitas_alatt' | 'selejtezett';

export interface Vehicle {
  id: number;
  uic_number: string; // Teljes 12 jegyű pályaszám (pl. 91 55 0470 001-3)
  series: string; // Sorozat (pl. 470, 431, 415)
  nickname?: string; // Becenév (pl. Taurus, Szili, Flirt)
  type: VehicleType; // Jármű típusa
  status: VehicleStatus; // Jelenlegi státusz
  depot: string; // Honállomás (pl. Budapest-Ferencváros)
  manufacturer: string; // Gyártó
  year_built: number; // Gyártási év
  image_url?: string; // Fő fotó
  last_spotted?: {
    location: string;
    time: string; // ISO dátum formátum
  };
}

// A szűrők sorrendje és a megjelenő feliratok egy helyen. A Record típus miatt
// a fordító szól, ha új típust/állapotot veszel fel, de a feliratát elfelejted.
export const VEHICLE_TYPES: VehicleType[] = [
  'villamos_mozdony',
  'dizel_mozdony',
  'motorvonat',
  'szemelykocsi',
  'teherkocsi',
];

export const VEHICLE_STATUSES: VehicleStatus[] = [
  'aktiv',
  'fenntartott',
  'felujitas_alatt',
  'selejtezett',
];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  villamos_mozdony: 'Villamos mozdony',
  dizel_mozdony: 'Dízel mozdony',
  motorvonat: 'Motorvonat',
  szemelykocsi: 'Személykocsi',
  teherkocsi: 'Teherkocsi',
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  aktiv: 'Aktív',
  fenntartott: 'Fenntartott',
  felujitas_alatt: 'Felújítás alatt',
  selejtezett: 'Selejtezett',
};
