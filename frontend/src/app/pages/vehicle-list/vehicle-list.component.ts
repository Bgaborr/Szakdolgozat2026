import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../core/services/vehicle.service';
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from '../../models/vehicle.model';
import { matches } from '../../core/shared/text-search.utils';

const PLACEHOLDER = 'assets/placeholder.jpg';

const compact = (text: string) => text.replace(/[^0-9a-z]/gi, '').toLowerCase();

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vehicle-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './vehicle-list.component.scss',
})
export class VehicleListComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private collator = new Intl.Collator('hu', { numeric: true });
  private dateFormat = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  readonly placeholder = PLACEHOLDER;
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  vehicles = signal<Vehicle[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);

  searchTerm = signal('');
  typeFilter = signal<VehicleType | ''>('');
  statusFilter = signal<VehicleStatus | ''>('');
  private queryMatches = computed(() => {
    const q = this.searchTerm().trim();
    if (!q) return this.vehicles();
    const compactQuery = compact(q);
    return this.vehicles().filter(
      (v) =>
        [v.series, v.nickname, v.depot, v.manufacturer].some((t) => !!t && matches(t, q)) ||
        (compactQuery !== '' && compact(v.uic_number).includes(compactQuery)),
    );
  });

  typeOptions = computed(() => {
    const status = this.statusFilter();
    const pool = this.queryMatches().filter((v) => !status || v.status === status);
    return VEHICLE_TYPES.filter((t) => this.vehicles().some((v) => v.type === t)).map((value) => ({
      value,
      label: VEHICLE_TYPE_LABELS[value],
      count: pool.filter((v) => v.type === value).length,
    }));
  });

  statusOptions = computed(() => {
    const type = this.typeFilter();
    const pool = this.queryMatches().filter((v) => !type || v.type === type);
    return VEHICLE_STATUSES.filter((s) => this.vehicles().some((v) => v.status === s)).map(
      (value) => ({
        value,
        label: VEHICLE_STATUS_LABELS[value],
        count: pool.filter((v) => v.status === value).length,
      }),
    );
  });

  allCountForType = computed(() => this.typeOptions().reduce((sum, o) => sum + o.count, 0));
  allCountForStatus = computed(() => this.statusOptions().reduce((sum, o) => sum + o.count, 0));

  filteredVehicles = computed(() => {
    const type = this.typeFilter();
    const status = this.statusFilter();
    return this.queryMatches()
      .filter((v) => (!type || v.type === type) && (!status || v.status === status))
      .sort(
        (a, b) =>
          this.collator.compare(a.series, b.series) ||
          this.collator.compare(a.uic_number, b.uic_number),
      );
  });

  hasFilters = computed(
    () => this.searchTerm().trim() !== '' || this.typeFilter() !== '' || this.statusFilter() !== '',
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.message || 'A járművek betöltése nem sikerült.');
      },
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.typeFilter.set('');
    this.statusFilter.set('');
  }

  statusLabel(status: VehicleStatus): string {
    return VEHICLE_STATUS_LABELS[status] ?? status;
  }

  typeLabel(type: VehicleType): string {
    return VEHICLE_TYPE_LABELS[type] ?? type;
  }

  imageAlt(v: Vehicle): string {
    return `${v.series}${v.nickname ? ' ' + v.nickname : ''} (${v.uic_number})`;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback']) return;
    img.dataset['fallback'] = '1';
    img.src = PLACEHOLDER;
  }

  spottedText(isoTime: string, now: number = Date.now()): string {
    const then = new Date(isoTime).getTime();
    if (Number.isNaN(then)) return '';
    const date = this.dateFormat.format(then);

    const minutes = Math.floor((now - then) / 60000);
    if (minutes < 0) return date;
    if (minutes < 1) return `most · ${date}`;
    if (minutes < 60) return `${minutes} perce · ${date}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} órája · ${date}`;
    const days = Math.floor(hours / 24);
    if (days <= 30) return `${days} napja · ${date}`;
    return date;
  }
}
