import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GalleryService } from '../../core/services/gallery.service';
import { AuthService } from '../../core/services/auth.service';
import { GalleryPost } from '../../models/gallery-post.model';
import { RATIOS, Ratio, bestRatio, clampCenter, cropSize, outputSize } from './image-crop.util';

type Category = 'locomotive' | 'passenger_car' | 'multiple_unit';
type Filter = 'all' | Category;
const MAX_SOURCE_MB = 30;
const MIN_WIDTH = 600;
const MAX_OUT_WIDTH = 2400;
const JPEG_QUALITY = 0.88;
const MAX_ZOOM = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface Source {
  url: string;
  name: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private galleryService = inject(GalleryService);
  auth = inject(AuthService);

  readonly maxSourceMb = MAX_SOURCE_MB;
  readonly minWidth = MIN_WIDTH;
  readonly maxZoom = MAX_ZOOM;
  readonly ratios = RATIOS;
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  readonly categories: { value: Category; label: string }[] = [
    { value: 'locomotive', label: 'Mozdony' },
    { value: 'passenger_car', label: 'Személykocsi' },
    { value: 'multiple_unit', label: 'Motorvonat' },
  ];
  readonly filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Mind' },
    ...this.categories,
  ];

  posts = signal<GalleryPost[]>([]);
  loading = signal(true);
  filter = signal<Filter>('all');
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  filteredPosts = computed(() => {
    const f = this.filter();
    const all = this.posts();
    return f === 'all' ? all : all.filter((p) => p.vehicle_category === f);
  });

  counts = computed(() => {
    const all = this.posts();
    const c: Record<Filter, number> = {
      all: all.length,
      locomotive: 0,
      passenger_car: 0,
      multiple_unit: 0,
    };
    for (const p of all) {
      const k = p.vehicle_category as Category;
      if (k in c) c[k]++;
    }
    return c;
  });

  deleteTarget = signal<GalleryPost | null>(null);
  deleting = signal(false);
  deleteError = signal<string | null>(null);

  lightboxIndex = signal<number | null>(null);
  current = computed(() => {
    const i = this.lightboxIndex();
    return i === null ? null : (this.filteredPosts()[i] ?? null);
  });

  showModal = signal(false);
  fileError = signal<string | null>(null);
  dragging = signal(false);
  uploading = signal(false);

  source = signal<Source | null>(null);
  ratio = signal<Ratio>(RATIOS[0]);
  zoom = signal(1);
  center = signal({ cx: 0, cy: 0 });
  panning = signal(false);
  private imageEl: HTMLImageElement | null = null;
  private drag: { x: number; y: number; cx: number; cy: number; scale: number } | null = null;

  crop = computed(() => {
    const s = this.source();
    return s ? cropSize(s.width, s.height, this.ratio().value, this.zoom()) : null;
  });

  outSize = computed(() => {
    const c = this.crop();
    return c ? outputSize(c.w, this.ratio().value, MAX_OUT_WIDTH) : null;
  });

  tooSmall = computed(() => {
    const c = this.crop();
    return c !== null && c.w < MIN_WIDTH;
  });

  cropView = computed(() => {
    const s = this.source();
    const c = this.crop();
    if (!s || !c) return null;
    const { cx, cy } = this.center();
    return {
      width: (s.width / c.w) * 100,
      left: -((cx - c.w / 2) / c.w) * 100,
      top: -((cy - c.h / 2) / c.h) * 100,
    };
  });

  frameAspect = computed(() => this.ratio().label.replace(':', ' / '));

  form = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    vehicle_category: ['locomotive', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.clearFile();
  }

  loadPosts(): void {
    this.galleryService.getAll().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Hiba a képek betöltésekor', err);
        this.loading.set(false);
      },
    });
  }

  getImageUrl(path: string): string {
    return `/storage/${path}`;
  }

  categoryLabel(value: string): string {
    return this.categories.find((c) => c.value === value)?.label ?? 'Egyéb';
  }

  uploaderName(post: GalleryPost): string | null {
    return post.user?.name?.trim() || null;
  }

  initial(post: GalleryPost): string {
    return this.uploaderName(post)?.charAt(0).toUpperCase() ?? '?';
  }

  setFilter(value: Filter): void {
    this.filter.set(value);
    this.lightboxIndex.set(null);
  }

  canDelete(post: GalleryPost): boolean {
    if (this.auth.hasPermission('delete-images') || this.auth.hasPermission('approve-gallery')) {
      return true;
    }
    const ownerId = (post as GalleryPost & { user_id?: number | string | null }).user_id;
    const me = this.auth.getUserId();
    return ownerId != null && me !== null && Number(ownerId) === Number(me);
  }

  askDelete(post: GalleryPost): void {
    if (!this.canDelete(post)) return;
    this.deleteError.set(null);
    this.deleteTarget.set(post);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const post = this.deleteTarget();
    if (!post || this.deleting()) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.galleryService.deletePost(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        this.deleting.set(false);
        this.deleteTarget.set(null);

        const i = this.lightboxIndex();
        if (i !== null) {
          const left = this.filteredPosts().length;
          this.lightboxIndex.set(left === 0 ? null : Math.min(i, left - 1));
        }

        this.success.set('A kép törölve.');
        setTimeout(() => this.success.set(null), 4000);
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(
          err?.status === 403
            ? 'Nincs jogosultságod a kép törléséhez.'
            : err?.error?.message || 'A törlés nem sikerült. Próbáld újra.',
        );
      },
    });
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  next(): void {
    this.step(1);
  }

  prev(): void {
    this.step(-1);
  }

  private step(direction: number): void {
    const count = this.filteredPosts().length;
    const i = this.lightboxIndex();
    if (i === null || count === 0) return;
    this.lightboxIndex.set((i + direction + count) % count);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (this.deleteTarget()) {
      if (e.key === 'Escape') this.cancelDelete();
      return;
    }
    if (this.lightboxIndex() !== null) {
      if (e.key === 'Escape') this.closeLightbox();
      else if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
    } else if (this.showModal() && e.key === 'Escape') {
      this.closeModal();
    }
  }

  openModal(): void {
    this.showModal.set(true);
    this.error.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.form.reset({ vehicle_category: 'locomotive' });
    this.clearFile();
    this.dragging.set(false);
    this.error.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    if (picked) void this.handleFile(picked);
    input.value = '';
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) void this.handleFile(dropped);
  }

  clearFile(): void {
    const s = this.source();
    if (s) URL.revokeObjectURL(s.url);
    this.source.set(null);
    this.imageEl = null;
    this.drag = null;
    this.panning.set(false);
    this.fileError.set(null);
    this.zoom.set(1);
  }

  private async handleFile(picked: File): Promise<void> {
    this.clearFile();

    if (!ALLOWED_TYPES.includes(picked.type)) {
      this.fileError.set('Csak JPG, PNG vagy WebP kép tölthető fel.');
      return;
    }
    if (picked.size > MAX_SOURCE_MB * 1024 * 1024) {
      this.fileError.set(`A fájl túl nagy. Legfeljebb ${MAX_SOURCE_MB} MB lehet.`);
      return;
    }

    const url = URL.createObjectURL(picked);
    let img: HTMLImageElement;
    try {
      img = await this.loadImage(url);
    } catch {
      URL.revokeObjectURL(url);
      this.fileError.set('A kép nem olvasható be. Próbálj meg másik (JPG vagy PNG) fájlt.');
      return;
    }

    this.imageEl = img;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    this.source.set({ url, name: picked.name, width, height });
    this.ratio.set(bestRatio(width, height));
    this.zoom.set(1);
    this.center.set({ cx: width / 2, cy: height / 2 });
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('A kép nem olvasható'));
      img.src = url;
    });
  }

  setRatio(r: Ratio): void {
    this.ratio.set(r);
    this.zoom.set(1);
    const { cx, cy } = this.center();
    this.setCenter(cx, cy);
  }

  setZoom(z: number): void {
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(1, z)));
    const { cx, cy } = this.center();
    this.setCenter(cx, cy);
  }

  zoomBy(factor: number): void {
    this.setZoom(this.zoom() * factor);
  }

  onZoomInput(e: Event): void {
    this.setZoom(Number((e.target as HTMLInputElement).value));
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.zoomBy(e.deltaY < 0 ? 1.08 : 1 / 1.08);
  }

  onPointerDown(e: PointerEvent): void {
    const frame = e.currentTarget as HTMLElement;
    const c = this.crop();
    if (!c) return;
    frame.setPointerCapture(e.pointerId);
    const { cx, cy } = this.center();

    this.drag = {
      x: e.clientX,
      y: e.clientY,
      cx,
      cy,
      scale: frame.getBoundingClientRect().width / c.w,
    };
    this.panning.set(true);
  }

  onPointerMove(e: PointerEvent): void {
    const d = this.drag;
    if (!d) return;
    this.setCenter(d.cx - (e.clientX - d.x) / d.scale, d.cy - (e.clientY - d.y) / d.scale);
  }

  onPointerUp(): void {
    this.drag = null;
    this.panning.set(false);
  }

  onFrameKey(e: KeyboardEvent): void {
    const c = this.crop();
    if (!c) return;
    const step = c.w * 0.05;
    const { cx, cy } = this.center();
    switch (e.key) {
      case 'ArrowLeft':
        this.setCenter(cx - step, cy);
        break;
      case 'ArrowRight':
        this.setCenter(cx + step, cy);
        break;
      case 'ArrowUp':
        this.setCenter(cx, cy - step);
        break;
      case 'ArrowDown':
        this.setCenter(cx, cy + step);
        break;
      case '+':
      case '=':
        this.zoomBy(1.1);
        break;
      case '-':
        this.zoomBy(1 / 1.1);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  private setCenter(cx: number, cy: number): void {
    const s = this.source();
    if (!s) return;
    this.center.set(clampCenter(s.width, s.height, this.ratio().value, this.zoom(), cx, cy));
  }

  private renderCrop(): Promise<Blob> {
    const img = this.imageEl;
    const c = this.crop();
    const out = this.outSize();
    if (!img || !c || !out) return Promise.reject(new Error('Nincs kép'));

    const canvas = document.createElement('canvas');
    canvas.width = out.w;
    canvas.height = out.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.reject(new Error('Nincs canvas'));

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.w, out.h);
    ctx.imageSmoothingQuality = 'high';
    const { cx, cy } = this.center();
    ctx.drawImage(img, cx - c.w / 2, cy - c.h / 2, c.w, c.h, 0, 0, out.w, out.h);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('A kép feldolgozása nem sikerült'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    });
  }

  async onSubmit(): Promise<void> {
    const s = this.source();
    if (this.form.invalid || !s || this.tooSmall()) {
      this.error.set('Kérlek add meg a címet, és válassz egy megfelelő felbontású képet!');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);

    let blob: Blob;
    try {
      blob = await this.renderCrop();
    } catch {
      this.uploading.set(false);
      this.error.set('A kép feldolgozása nem sikerült. Próbálj meg másik képet.');
      return;
    }

    const values = this.form.getRawValue();
    const fileName = s.name.replace(/\.[^.]+$/, '') + '.jpg';
    const formData = new FormData();
    formData.append('title', values.title || '');
    formData.append('description', values.description || '');
    formData.append('vehicle_category', values.vehicle_category || '');
    formData.append('image', blob, fileName);

    this.galleryService.create(formData).subscribe({
      next: () => {
        this.uploading.set(false);
        this.success.set(
          'Kép sikeresen feltöltve! Az adminisztrátori jóváhagyás után fog megjelenni a galériában.',
        );
        this.closeModal();
        this.loadPosts();
        setTimeout(() => this.success.set(null), 6000);
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err.error?.message || 'Hiba a feltöltéskor.');
      },
    });
  }
}
