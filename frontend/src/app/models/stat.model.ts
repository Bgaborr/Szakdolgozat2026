export interface VehicleStats {
  total: number;
  active: number;
  inactive: number;
  by_depot: Record<string, number>; 
  by_type: Record<string, number>; 
}