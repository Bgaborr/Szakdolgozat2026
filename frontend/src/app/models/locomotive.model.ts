import { LocomotiveType } from '../models/locomotive-type.model';
import { ServiceLocation } from '../models/service-location.model';

export interface Locomotive {
  id: number;
  locomotive_type_id: number;
  uic: string;
  service_location_id?: number | null;
  is_active: boolean;
  comment?: string | null;

  type?: LocomotiveType;
  service_location?: ServiceLocation;
  formatted_uic?: string;
}
