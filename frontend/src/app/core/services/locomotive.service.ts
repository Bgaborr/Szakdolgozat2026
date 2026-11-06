import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Locomotive } from '../../models/locomotive.model';
import { LocomotiveType } from '../../models/locomotive-type.model';
import { Observable } from 'rxjs';

export type CreateLocomotiveDTO = Omit<
  Locomotive,
  'id' | 'type' | 'service_location' | 'formatted_uic'
>;
export type UpdateLocomotiveDTO = Partial<CreateLocomotiveDTO>;

export interface SuggestionDTO {
  suggested_data: any;
  source?: string | null;
  source_link?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LocomotiveService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/locomotives`;
  private typesUrl = `${environment.apiUrl}/locomotive-types`;

  getTypes() {
    return this.http.get<LocomotiveType[]>(this.typesUrl, { withCredentials: true });
  }
  getAll() {
    return this.http.get<Locomotive[]>(this.apiUrl, { withCredentials: true });
  }
  create(data: CreateLocomotiveDTO) {
    return this.http.post<Locomotive>(this.apiUrl, data, { withCredentials: true });
  }
  update(id: number, data: UpdateLocomotiveDTO) {
    return this.http.put<Locomotive>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }
  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
  suggestUpdate(id: number, data: SuggestionDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/suggestions`, data, { withCredentials: true });
  }
}
