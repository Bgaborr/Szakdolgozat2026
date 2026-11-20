import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ServiceLocationService } from '../../core/services/service-location.service';
import { MultipleUnitService } from '../../core/services/multiple-units.service';
import { MultipleUnit } from '../../models/multiple-unit.model';
import { MultipleUnitType } from '../../models/multiple-unit-type.model';
import { ServiceLocation } from '../../models/service-location.model';

@Component({
  selector: 'app-multiple-units',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './multiple-units.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './multiple-units.component.scss',
})
export class MultipleUnitsComponent implements OnInit {
  authservice = inject(AuthService);
  private muService = inject(MultipleUnitService);
  private locationService = inject(ServiceLocationService);
  private fb = inject(FormBuilder);

  multipleunits = signal<MultipleUnit[]>([]);
  types = signal<MultipleUnitType[]>([]);
  locations = signal<ServiceLocation[]>([]);

  loading = signal(true);
  showModal = signal(false);
  showDetails = signal(false);

  selectedMu = signal<MultipleUnit | null>(null);
  editingMu = signal<MultipleUnit | null>(null);
  searchQuery = signal<string>('');

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    multiple_unit_type_id: [null as number | null, [Validators.required]],
    uic: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(16)]],
    home_depot_id: [null as number | null],
    service_location_id: [null as number | null],
    next_rev_date: [null as Date | null],
    is_active: [true],
    comment: [''],
    source: ['saját forrás', [Validators.required]],
    source_link: [''],
  });

  ngOnInit(): void {
    this.loadMultipleUnit();
    this.loadTypes();
    this.loadLocations();
  }

  loadMultipleUnit() {
    this.loading.set(true);
    this.muService.getAll().subscribe({
      next: (data) => {
        this.multipleunits.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTypes() {
    this.muService.getTypes().subscribe((data) => this.types.set(data));
  }

  loadLocations() {
    this.locationService.getAll().subscribe((data) => this.locations.set(data));
  }

  openCreate() {
    this.editingMu.set(null);
    this.form.reset({ is_active: true, source: 'saját forrás' });
    this.showModal.set(true);
  }

  openEdit(mu: MultipleUnit) {
    this.editingMu.set(mu);
    this.form.patchValue({
      multiple_unit_type_id: mu.multiple_unit_type_id,
      uic: mu.uic,
      home_depot_id: mu.home_depot_id,
      service_location_id: mu.service_location_id,
      next_rev_date: mu.next_rev_date,
      is_active: mu.is_active,
      comment: mu.comment,
      source: 'saját forrás',
      source_link: '',
    });
    this.showModal.set(true);
  }

  suggestMu(mu: MultipleUnit) {
    this.editingMu.set(mu);
    this.form.patchValue({
      multiple_unit_type_id: mu.multiple_unit_type_id,
      uic: mu.uic,
      home_depot_id: mu.home_depot_id,
      service_location_id: mu.service_location_id,
      next_rev_date: mu.next_rev_date,
      is_active: mu.is_active,
      comment: mu.comment,
      source: 'saját forrás',
      source_link: '',
    });
    this.showModal.set(true);
  }

  openDetails(mu: MultipleUnit) {
    this.showDetails.set(true);
    this.selectedMu.set(mu);
    setTimeout(() => {
      this.form.patchValue({
        multiple_unit_type_id: mu.multiple_unit_type_id,
        uic: mu.formatted_uic || mu.uic,
        home_depot_id: mu.home_depot_id,
        service_location_id: mu.service_location_id,
        next_rev_date: mu.next_rev_date,
        is_active: mu.is_active,
        comment: mu.comment,
      });
    }, 0);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedMu.set(null);
  }

  closeModal() {
    this.showModal.set(false);
    this.error.set(null);
  }

  filteredMultipleUnits = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.multipleunits();

    return this.multipleunits().filter(
      (mu) =>
        mu.uic.toLowerCase().includes(query) ||
        mu.formatted_uic?.toLowerCase().includes(query) ||
        mu.type?.name?.toLowerCase().includes(query),
    );
  });

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const { source, source_link, ...muData } = formValue;
    const editing = this.editingMu();
    const canEdit = this.authservice.hasPermission('edit-vehicles');

    let request$;

    if (!editing) {
      request$ = this.muService.create(formValue as any);
    } else {
      request$ = canEdit
        ? this.muService.update(editing.id, formValue as any)
        : this.muService.suggestUpdate(editing.id, {
            suggested_data: muData,
            source: source,
            source_link: source_link,
          });
    }

    request$.subscribe({
      next: () => {
        let successMsg = 'Motorvonat rögzítve!';
        if (editing) {
          successMsg = canEdit
            ? 'Motorvonat frissítve!'
            : 'Módosítási javaslatod elküldve bírálatra!';
        }
        this.success.set(successMsg);
        this.closeModal();
        this.loadMultipleUnit();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a mentés során.'),
    });
  }

  deleteMu(mu: MultipleUnit) {
    if (!confirm(`Biztosan törlöd a(z) ${mu.uic} pályaszámú motorvonatot?`)) return;

    this.muService.delete(mu.id).subscribe({
      next: () => {
        this.success.set('Motorvonat törölve!');
        this.loadMultipleUnit();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a törléskor.'),
    });
  }
}
