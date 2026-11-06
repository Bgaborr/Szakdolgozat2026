export interface Suggestion {
  id: number;
  vehicle_id: number;
  vehicle_type: 'locomotive' | 'passenger_car' | 'multiple_unit';
  user_id: number;
  field_name: string; 
  suggested_value: string | number | boolean;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}