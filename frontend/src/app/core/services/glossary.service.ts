import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Glossary } from '../../models/glossary.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GlossaryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/glossary`;

  getGlossaries(): Observable<Glossary[]> {
    return this.http.get<Glossary[]>(this.apiUrl);
  }
  addGlossary(data: Glossary): Observable<Glossary> {
    return this.http.post<Glossary>(this.apiUrl, data);
  }
  updateGlossary(id: number, data: Glossary): Observable<Glossary> {
    return this.http.put<Glossary>(`${this.apiUrl}/${id}`, data);
  }
  deleteGlossary(id: number): Observable<Glossary> {
    return this.http.delete<Glossary>(`${this.apiUrl}/${id}`);
  }
}
