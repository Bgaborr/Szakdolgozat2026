import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface StatResponseDTO {
  [key: string]: any;
}
@Injectable({
  providedIn: 'root',
})
export class StatService {
  private apiUrl = `${environment.apiUrl}/stat`;
  constructor(private http: HttpClient) {}
  getLocomotiveStats(): Observable<StatResponseDTO> {
    return this.http.get<any>(this.apiUrl + '/locomotives');
  }

  getPassengerCarStats(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/passenger-cars');
  }

  getMultipleUnitStats() {
    return this.http.get<any>(`${this.apiUrl}/multiple-units`);
  }
  getAdvancedStats() {
    return this.http.get<any>(`${this.apiUrl}/advanced`);
  }
}
