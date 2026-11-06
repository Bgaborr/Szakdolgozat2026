import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassengerCarService } from '../../../core/services/passenger-car.service';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./suggestions.component.scss'],
})
export class SuggestionsComponent implements OnInit {
  private carService = inject(PassengerCarService);

  suggestions = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  message = signal<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.isLoading.set(true);
    this.carService.getPendingSuggestions().subscribe({
      next: (data) => {
        this.suggestions.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.showMessage('Hiba a javaslatok betöltésekor. Ellenőrizd a szervert!', 'error');
        this.isLoading.set(false);
      },
    });
  }

  approve(id: number) {
    if (!confirm('Biztosan elfogadod ezt a javaslatot? A módosítás felülírja az eredeti járművet!'))
      return;

    this.carService.approveSuggestion(id).subscribe({
      next: () => {
        this.showMessage('Javaslat sikeresen elfogadva, jármű frissítve!', 'success');
        this.loadSuggestions();
      },
      error: () => this.showMessage('Hiba történt az elfogadás során.', 'error'),
    });
  }

  reject(id: number) {
    if (!confirm('Biztosan elutasítod ezt a javaslatot?')) return;

    this.carService.rejectSuggestion(id).subscribe({
      next: () => {
        this.showMessage('Javaslat elutasítva és lezárva.', 'info');
        this.loadSuggestions();
      },
      error: () => this.showMessage('Hiba történt az elutasítás során.', 'error'),
    });
  }

  private showMessage(text: string, type: 'success' | 'error' | 'info') {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
