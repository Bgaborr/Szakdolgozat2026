import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PassengerCar } from '../../models/passenger-car.model';
import { PassengerCarType } from '../../models/passenger-car-type.model';
import { ServiceLocation } from '../../models/service-location.model';
import { PassengerCarService } from '../../core/services/passenger-car.service';
import { ServiceLocationService } from '../../core/services/service-location.service';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-passenger-cars',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './passenger-cars.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './passenger-cars.component.scss',
})
export class PassengerCarsComponent implements OnInit {
  authService = inject(AuthService);
  private carService = inject(PassengerCarService);
  private locationService = inject(ServiceLocationService);
  private fb = inject(FormBuilder);

  cars = signal<PassengerCar[]>([]);
  types = signal<PassengerCarType[]>([]);
  locations = signal<ServiceLocation[]>([]);

  loading = signal(true);
  showModal = signal(false);
  showDetails = signal(false);
  editingCar = signal<PassengerCar | null>(null);
  selectedCar = signal<PassengerCar | null>(null);

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    passenger_car_type_id: [null as number | null, [Validators.required]],
    uic: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(16)]],
    next_rev_date: [null as string | null],
    service_location_id: [null as number | null, [Validators.required]],
    home_depot_id: [null as number | null, [Validators.required]],
    number_of_seats: [null as number | null],
    vmax: [null as number | null],
    is_active: [true],
    comment: [''],
    source: ['saját forrás', [Validators.required]],
    source_link: [''],
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    this.loading.set(true);
    forkJoin({
      cars: this.carService.getAll(),
      types: this.carService.getTypes(),
      locations: this.locationService.getAll(),
    }).subscribe({
      next: (result) => {
        this.cars.set(result.cars);
        this.types.set(result.types);
        this.locations.set(result.locations);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Hiba az adatok letöltésekor', err);
        this.error.set('Nem sikerült betölteni a szükséges adatokat.');
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.editingCar.set(null);
    this.form.reset({ is_active: true });
    this.showModal.set(true);
  }

  loadCars() {
    this.carService.getAll().subscribe({
      next: (data) => this.cars.set(data),
      error: (err) => console.error('Hiba a kocsik frissítésekor', err),
    });
  }

  openDetails(car: PassengerCar) {
    this.showDetails.set(true);
    this.selectedCar.set(car);
    setTimeout(() => {
      this.form.patchValue({
        passenger_car_type_id: car.passenger_car_type_id,
        uic: car.uic,
        next_rev_date: car.next_rev_date,
        home_depot_id: car.home_depot_id,
        service_location_id: car.service_location_id,
        number_of_seats: car.type?.number_of_seats,
        vmax: car?.vmax,
        is_active: car.is_active,
        comment: car.comment,
      });
    }, 0);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedCar.set(null);
  }

  openEdit(car: PassengerCar) {
    this.editingCar.set(car);
    this.showModal.set(true);
    setTimeout(() => {
      this.form.patchValue({
        passenger_car_type_id: car.passenger_car_type_id,
        uic: car.uic,
        next_rev_date: car.next_rev_date,
        home_depot_id: car.home_depot_id,
        service_location_id: car.service_location_id,
        number_of_seats: car.number_of_seats,
        vmax: car.vmax,
        is_active: car.is_active,
        comment: car.comment,
      });
    }, 0);
  }

  closeModal() {
    this.showModal.set(false);
    this.error.set(null);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const { source, source_link, ...carData } = formValue;
    const editing = this.editingCar();
    const canEdit = this.authService.hasPermission('edit-vehicles');

    let request$;

    if (!editing) {
      request$ = this.carService.create(formValue as any);
    } else {
      request$ = canEdit
        ? this.carService.update(editing.id, formValue as any)
        : this.carService.suggestUpdate(editing.id, {
            suggested_data: carData,
            source: source,
            source_link: source_link,
          });
    }

    request$.subscribe({
      next: () => {
        let successMsg = 'Személykocsi rögzítve!';
        if (editing) {
          successMsg = canEdit
            ? 'Személykocsi frissítve!'
            : 'Módosítási javaslatod elküldve bírálatra!';
        }
        this.success.set(successMsg);
        this.closeModal();
        this.loadCars();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a mentés során.'),
    });
  }

  deleteCar(car: PassengerCar) {
    if (!confirm(`Biztosan törlöd a(z) ${car.uic} pályaszámú kocsit?`)) return;

    this.carService.delete(car.id).subscribe({
      next: () => {
        this.success.set('Személykocsi törölve!');
        this.loadCars();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba a törléskor.'),
    });
  }
}
