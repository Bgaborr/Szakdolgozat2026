import { PassengerCarType } from './passenger-car-type.model';
import { ServiceLocation } from './service-location.model';

export interface PassengerCar {
  id: number;
  passenger_car_type_id: number;
  uic: string;
  next_rev_date?: string | null;
  home_depot_id: number;
  service_location_id?: number | null;
  number_of_seats?: number | null;
  vmax?: number | null;
  is_active: boolean;
  comment?: string | null;

  type?: PassengerCarType;
  service_location?: ServiceLocation;
  home_depot?: ServiceLocation;
  formatted_uic?: string;
}
