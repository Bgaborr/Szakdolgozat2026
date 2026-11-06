import { CarCategory } from './car-category.model';

export interface PassengerCarType {
  type_number: string;
  id: number;
  name: string;
  number_of_seats?: number | null;
  category?: CarCategory;
}
