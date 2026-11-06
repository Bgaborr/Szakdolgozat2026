import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MultipleUnitType } from '../../models/multiple-unit-type.model';
import { MultipleUnit } from '../../models/multiple-unit.model';
import { Observable } from 'rxjs';

export type CreateMultipleUnitDTO = Omit<
  MultipleUnit,
  'id' | 'type' | 'service_location' | 'home_depot' | 'formatted_uic'
>;
export type UpdateMultipleUnitDTO = Partial<CreateMultipleUnitDTO>;

export interface SuggestionDTO {
  suggested_data: any;
  source?: string | null;
  source_link?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MultipleUnitService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mu`;
  private typesUrl = `${environment.apiUrl}/mu-types`;

  getTypes() {
    return this.http.get<MultipleUnitType[]>(this.typesUrl, { withCredentials: true });
  }
  getAll() {
    return this.http.get<MultipleUnit[]>(this.apiUrl, { withCredentials: true });
  }
  create(data: CreateMultipleUnitDTO) {
    return this.http.post<MultipleUnit>(this.apiUrl, data, { withCredentials: true });
  }
  update(id: number, data: UpdateMultipleUnitDTO) {
    return this.http.put<MultipleUnit>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }
  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
  suggestUpdate(id: number, data: SuggestionDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/suggestions`, data, { withCredentials: true });
  }
}
