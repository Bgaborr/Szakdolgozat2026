import { LocomotiveType } from '../models/locomotive-type.model';
import { ServiceLocation } from '../models/service-location.model';

export interface MultipleUnit {
  id: number;
  multiple_unit_type_id: number;
  uic: string;
  home_depot_id?: number | null;
  service_location_id?: number | null;
  next_rev_date?: Date | null;
  is_active: boolean;
  comment?: string | null;

  type?: LocomotiveType;
  service_location?: ServiceLocation;
  home_depot?: ServiceLocation;
  formatted_uic?: string;
}
