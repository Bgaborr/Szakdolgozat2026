import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

export interface VehicleType {
  id: number;
  name: string;
  type_number: string;
  vmax?: number;
  category?: any;
}

type TabType = 'locomotive' | 'multiple_unit' | 'passenger_car';

@Component({
  selector: 'app-vehicle-types',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-types.component.html',
  styleUrl: './vehicle-types.component.scss',
})
export class VehicleTypesComponent implements OnInit {
  authservice = inject(AuthService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  activeTab = signal<TabType>('locomotive');
  types = signal<VehicleType[]>([]);

  loading = signal(true);
  showModal = signal(false);
  showDetails = signal(false);
  editingType = signal<VehicleType | null>(null);
  selectedType = signal<VehicleType | null>(null);
  searchQuery = signal<string>('');

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    type_number: ['', [Validators.required]],
    vmax: [null as number | null],
    source: ['saját forrás', [Validators.required]],
    source_link: [''],
  });

  private apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.loadTypes();
  }

  get currentEndpoint(): string {
    switch (this.activeTab()) {
      case 'locomotive':
        return `${this.apiUrl}/locomotive-types`;
      case 'multiple_unit':
        return `${this.apiUrl}/mu-types`;
      case 'passenger_car':
        return `${this.apiUrl}/passenger-car-types`;
    }
  }

  switchTab(tab: TabType) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.loadTypes();
  }

  loadTypes() {
    this.loading.set(true);
    this.http.get<VehicleType[]>(this.currentEndpoint).subscribe({
      next: (data) => {
        this.types.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hiba a típusok betöltésekor.');
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.editingType.set(null);
    this.form.reset({ source: 'saját forrás' });
    this.showModal.set(true);
  }

  openEdit(typeItem: VehicleType) {
    this.editingType.set(typeItem);
    this.form.patchValue({
      name: typeItem.name,
      type_number: typeItem.type_number,
      vmax: typeItem.vmax,
      source: 'saját forrás',
      source_link: '',
    });
    this.showModal.set(true);
  }

  suggestType(typeItem: VehicleType) {
    this.openEdit(typeItem);
  }

  openDetails(typeItem: VehicleType) {
    this.showDetails.set(true);
    this.selectedType.set(typeItem);
    setTimeout(() => {
      this.form.patchValue({
        name: typeItem.name,
        type_number: typeItem.type_number,
        vmax: typeItem.vmax,
      });
    }, 0);
  }

  closeModal() {
    this.showModal.set(false);
    this.error.set(null);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedType.set(null);
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  filteredTypes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.types();

    return this.types().filter(
      (t) =>
        t.name?.toLowerCase().includes(query) ||
        t.type_number?.toString().toLowerCase().includes(query),
    );
  });

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const { source, source_link, ...typeData } = formValue;
    const editing = this.editingType();
    const canEdit = this.authservice.hasPermission('manage-vehicle-types');

    let request$;

    if (!editing) {
      request$ = this.http.post(this.currentEndpoint, typeData);
    } else {
      request$ = canEdit
        ? this.http.put(`${this.currentEndpoint}/${editing.id}`, typeData)
        : this.http.post(`${this.currentEndpoint}/${editing.id}/suggest`, {
            suggested_data: typeData,
            source: source,
            source_link: source_link,
          });
    }

    request$.subscribe({
      next: () => {
        let successMsg = 'Típus rögzítve!';
        if (editing) {
          successMsg = canEdit ? 'Típus frissítve!' : 'Módosítási javaslatod elküldve bírálatra!';
        }
        this.success.set(successMsg);
        this.closeModal();
        this.loadTypes();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err: any) => this.error.set(err.error?.message || 'Hiba a mentés során.'),
    });
  }

  deleteType(typeItem: VehicleType) {
    if (!confirm(`Biztosan törlöd a(z) ${typeItem.type_number} típust?`)) return;

    this.http.delete(`${this.currentEndpoint}/${typeItem.id}`).subscribe({
      next: () => {
        this.success.set('Típus törölve!');
        this.loadTypes();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err: any) => this.error.set(err.error?.message || 'Hiba a törléskor.'),
    });
  }
}
