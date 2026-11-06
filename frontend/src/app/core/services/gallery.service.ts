import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { GalleryPost } from '../../models/gallery-post.model';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gallery`;

  getAll() {
    return this.http.get<GalleryPost[]>(this.apiUrl);
  }

  create(formData: FormData) {
    return this.http.post(this.apiUrl, formData, { withCredentials: true });
  }
  getPendingPosts() {
    return this.http.get<GalleryPost[]>(`${this.apiUrl}/pending`, { withCredentials: true });
  }

  approvePost(id: number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/approve`, {}, { withCredentials: true });
  }

  rejectPost(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}/reject`, { withCredentials: true });
  }

  deletePost(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
