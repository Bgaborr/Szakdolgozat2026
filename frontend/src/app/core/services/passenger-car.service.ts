import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PassengerCar } from '../../models/passenger-car.model';
import { PassengerCarType } from '../../models/passenger-car-type.model';
import { Observable } from 'rxjs';

export type CreatePassengerCarDTO = Omit<
  PassengerCar,
  'id' | 'type' | 'service_location' | 'home_depot' | 'formatted_uic'
>;
export type UpdatePassengerCarDTO = Partial<CreatePassengerCarDTO>;

export interface SuggestionDTO {
  suggested_data: any;
  source?: string | null;
  source_link?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PassengerCarService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/passenger-cars`;
  private typesUrl = `${environment.apiUrl}/passenger-car-types`;
  private suggestionsUrl = `${environment.apiUrl}/suggestions`;

  getTypes() {
    return this.http.get<PassengerCarType[]>(this.typesUrl, { withCredentials: true });
  }
  getAll() {
    return this.http.get<PassengerCar[]>(this.apiUrl, { withCredentials: true });
  }
  create(data: CreatePassengerCarDTO) {
    return this.http.post<PassengerCar>(this.apiUrl, data, { withCredentials: true });
  }
  update(id: number, data: UpdatePassengerCarDTO) {
    return this.http.put<PassengerCar>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }
  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
  suggestUpdate(carId: number, data: SuggestionDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${carId}/suggestions`, data, { withCredentials: true });
  }
  getPendingSuggestions(): Observable<any[]> {
    return this.http.get<any[]>(this.suggestionsUrl, { withCredentials: true });
  }
  approveSuggestion(id: number): Observable<any> {
    return this.http.post(`${this.suggestionsUrl}/${id}/approve`, {}, { withCredentials: true });
  }
  rejectSuggestion(id: number): Observable<any> {
    return this.http.post(`${this.suggestionsUrl}/${id}/reject`, {}, { withCredentials: true });
  }
}
