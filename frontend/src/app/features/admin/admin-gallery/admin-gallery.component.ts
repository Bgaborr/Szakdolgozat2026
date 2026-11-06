import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../../core/services/gallery.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { GalleryPost } from '../../../models/gallery-post.model';
@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './admin-gallery.component.scss',
})
export class AdminGalleryComponent implements OnInit {
  authService = inject(AuthService);
  private galleryService = inject(GalleryService);

  pendingPosts = signal<GalleryPost[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  storageUrl = environment.apiUrl.replace('/api', '/storage/');

  ngOnInit(): void {
    this.loadPendingPosts();
  }

  loadPendingPosts() {
    this.loading.set(true);
    this.galleryService.getPendingPosts().subscribe({
      next: (data) => {
        console.log('Várakozó képek betöltve:', data);
        this.pendingPosts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Hiba a várakozó képek betöltésekor.');
        this.loading.set(false);
      },
    });
  }

  approvePost(post: any) {
    this.galleryService.approvePost(post.id).subscribe({
      next: (res) => {
        this.success.set(res.message || 'Kép sikeresen jóváhagyva!');
        this.pendingPosts.update((posts) => posts.filter((p) => p.id !== post.id));
        this.autoClearMessages();
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a jóváhagyás során.'),
    });
  }

  rejectPost(post: any) {
    if (!confirm(`Biztosan elutasítod és VÉGLEG törlöd a(z) "${post.title}" című képet?`)) return;

    this.galleryService.rejectPost(post.id).subscribe({
      next: (res) => {
        this.success.set(res.message || 'Kép elutasítva és törölve!');
        this.pendingPosts.update((posts) => posts.filter((p) => p.id !== post.id));
        this.autoClearMessages();
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a törléskor.'),
    });
  }

  private autoClearMessages() {
    setTimeout(() => {
      this.success.set(null);
      this.error.set(null);
    }, 3000);
  }
}
