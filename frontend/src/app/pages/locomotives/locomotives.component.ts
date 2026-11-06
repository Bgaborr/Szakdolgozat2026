import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Locomotive } from '../../models/locomotive.model';
import { LocomotiveType } from '../../models/locomotive-type.model';
import { ServiceLocation } from '../../models/service-location.model';
import { LocomotiveService } from '../../core/services/locomotive.service';
import { ServiceLocationService } from '../../core/services/service-location.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-locomotives',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './locomotives.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './locomotives.component.scss',
})
export class LocomotivesComponent implements OnInit {
  authservice = inject(AuthService);
  private locService = inject(LocomotiveService);
  private locationService = inject(ServiceLocationService);
  private fb = inject(FormBuilder);

  locomotives = signal<Locomotive[]>([]);
  types = signal<LocomotiveType[]>([]);
  locations = signal<ServiceLocation[]>([]);

  loading = signal(true);
  showModal = signal(false);
  showDetails = signal(false);
  editingLoc = signal<Locomotive | null>(null);
  selectedLoc = signal<Locomotive | null>(null);

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    locomotive_type_id: [null as number | null, [Validators.required]],
    uic: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(16)]],
    service_location_id: [null as number | null],
    vmax: [null as number | null],
    is_active: [true],
    comment: [''],
    source: ['saját forrás', [Validators.required]],
    source_link: [''],
  });

  ngOnInit(): void {
    this.loadLocomotives();
    this.loadTypes();
    this.loadLocations();
  }

  loadLocomotives() {
    this.loading.set(true);
    this.locService.getAll().subscribe({
      next: (data) => {
        this.locomotives.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTypes() {
    this.locService.getTypes().subscribe((data) => this.types.set(data));
  }

  loadLocations() {
    this.locationService.getAll().subscribe((data) => this.locations.set(data));
  }

  openCreate() {
    this.editingLoc.set(null);
    this.form.reset({ is_active: true, source: 'saját forrás' });
    this.showModal.set(true);
  }

  openEdit(loc: Locomotive) {
    this.editingLoc.set(loc);
    this.form.patchValue({
      locomotive_type_id: loc.locomotive_type_id,
      uic: loc.uic,
      service_location_id: loc.service_location_id,
      vmax: loc.type?.vmax,
      is_active: loc.is_active,
      comment: loc.comment,
      source: 'saját forrás',
      source_link: '',
    });
    this.showModal.set(true);
  }

  suggestLoc(loc: Locomotive) {
    this.editingLoc.set(loc);
    this.form.patchValue({
      locomotive_type_id: loc.locomotive_type_id,
      uic: loc.uic,
      service_location_id: loc.service_location_id,
      vmax: loc.type?.vmax,
      is_active: loc.is_active,
      comment: loc.comment,
      source: 'saját forrás',
      source_link: '',
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.error.set(null);
  }

  openDetails(loco: Locomotive) {
    this.showDetails.set(true);
    this.selectedLoc.set(loco);
    setTimeout(() => {
      this.form.patchValue({
        locomotive_type_id: loco.locomotive_type_id,
        uic: loco.uic,
        service_location_id: loco.service_location_id,
        vmax: loco.type?.vmax,
        is_active: loco.is_active,
        comment: loco.comment,
      });
    }, 0);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedLoc.set(null);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const { source, source_link, ...locData } = formValue;
    const editing = this.editingLoc();
    const canEdit = this.authservice.hasPermission('edit-vehicles');

    let request$;

    if (!editing) {
      request$ = this.locService.create(formValue as any);
    } else {
      request$ = canEdit
        ? this.locService.update(editing.id, formValue as any)
        : this.locService.suggestUpdate(editing.id, {
            suggested_data: locData,
            source: source,
            source_link: source_link,
          });
    }

    request$.subscribe({
      next: () => {
        let successMsg = 'Mozdony rögzítve!';
        if (editing) {
          successMsg = canEdit ? 'Mozdony frissítve!' : 'Módosítási javaslatod elküldve bírálatra!';
        }
        this.success.set(successMsg);
        this.closeModal();
        this.loadLocomotives();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a mentés során.'),
    });
  }

  deleteLoc(loc: Locomotive) {
    if (!confirm(`Biztosan törlöd a(z) ${loc.uic} pályaszámú mozdonyt?`)) return;

    this.locService.delete(loc.id).subscribe({
      next: () => {
        this.success.set('Mozdony törölve!');
        this.loadLocomotives();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a törléskor.'),
    });
  }
}
