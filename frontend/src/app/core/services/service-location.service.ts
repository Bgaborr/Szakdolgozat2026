import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ServiceLocation } from '../../models/service-location.model';

export type CreateServiceLocationDTO = Omit<ServiceLocation, 'id' | 'vehicleCount'>;
export type UpdateServiceLocationDTO = Partial<CreateServiceLocationDTO>;

@Injectable({ providedIn: 'root' })
export class ServiceLocationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/service-locations`;

  getAll() {
    return this.http.get<ServiceLocation[]>(this.apiUrl, { withCredentials: true });
  }

  create(data: CreateServiceLocationDTO) {
    return this.http.post<ServiceLocation>(this.apiUrl, data, { withCredentials: true });
  }

  update(id: number, data: UpdateServiceLocationDTO) {
    return this.http.put<ServiceLocation>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}