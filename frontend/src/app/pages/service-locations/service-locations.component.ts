import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceLocation } from '../../models/service-location.model';
import { ServiceLocationService } from '../../../app/core/services/service-location.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-service-locations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-locations.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './service-locations.component.scss',
})
export class ServiceLocationsComponent implements OnInit {
  authService = inject(AuthService);
  private locationService = inject(ServiceLocationService);
  private fb = inject(FormBuilder);
  locations = signal<ServiceLocation[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingLocation = signal<ServiceLocation | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading.set(true);
    this.locationService.getAll().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hiba történt az adatok lekérésekor.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingLocation.set(null);
    this.form.reset({ name: '' });
    this.showModal.set(true);
  }

  openEdit(location: ServiceLocation): void {
    this.editingLocation.set(location);
    this.form.patchValue({
      name: location.name,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.error.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = { name: this.form.value.name! };
    const editing = this.editingLocation();

    const request$ = editing
      ? this.locationService.update(editing.id, data)
      : this.locationService.create(data);

    request$.subscribe({
      next: () => {
        this.success.set(editing ? 'Szolgálati hely frissítve!' : 'Szolgálati hely létrehozva!');
        this.closeModal();
        this.loadLocations();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) =>
        this.error.set(err.error?.message || err.error?.error || 'Hiba történt a mentés során.'),
    });
  }

  deleteLocation(location: ServiceLocation): void {
    if (!confirm(`Biztosan törlöd ezt a szolgálati helyet: ${location.name}?`)) return;

    this.locationService.delete(location.id).subscribe({
      next: () => {
        this.success.set('Szolgálati hely törölve!');
        this.loadLocations();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) =>
        this.error.set(
          err.error?.message ||
            err.error?.error ||
            'Hiba történt. Lehet, hogy járművek tartoznak ehhez az állomáshoz!',
        ),
    });
  }
}
