import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Vehicle } from '../../models/vehicle.model';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  // ================================================================
  // IDEIGLENES MOCK ADATBÁZIS
  // ================================================================
  private mockVehicles: Vehicle[] = [
    {
      id: 1,
      uic_number: '91 55 0470 001-3',
      series: '470',
      nickname: 'Taurus',
      type: 'villamos_mozdony',
      status: 'aktiv',
      depot: 'Budapest-Ferencváros',
      manufacturer: 'Siemens',
      year_built: 2001,
      image_url:
        'https://www.mavcsoport.hu/sites/default/files/styles/width_460/public/upload/img_6948.jpg?itok=eDpN0ehd',
      // === ÚJ RÉSZ: Friss észlelés ===
      last_spotted: {
        location: 'Kelenföld',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // "2 órája" szimulálva
      },
    },
    {
      id: 2,
      uic_number: '91 55 0431 001-2',
      series: '431',
      nickname: 'Szili',
      type: 'villamos_mozdony',
      status: 'aktiv',
      depot: 'Szolnok',
      manufacturer: 'Ganz-MÁVAG',
      year_built: 1964,
      image_url:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/M%C3%81V_V43_1001_original_color.jpg/1280px-M%C3%81V_V43_1001_original_color.jpg?utm_source=hu.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      // Nincs last_spotted, hogy teszteljük az üres állapotot is!
      last_spotted: {
        location: 'Kelenföld',
        time: '2024-05-21T10:30:00Z', // Példa ISO dátum formátum
      },
    },
  ];

  // Lekéri az összes járművet (Később itt http.get lesz)
  getVehicles(): Observable<Vehicle[]> {
    return of(this.mockVehicles);
  }

  // Lekér egyetlen járművet ID alapján az adatlaphoz
  getVehicleById(id: number): Observable<Vehicle | undefined> {
    const vehicle = this.mockVehicles.find((v) => v.id === id);
    return of(vehicle);
  }
}
