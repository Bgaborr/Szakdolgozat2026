import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { GlossaryService } from '../../core/services/glossary.service';
import { Glossary } from '../../models/glossary.model';
import { AuthService } from '../../core/services/auth.service';
import { Segment, highlightSegments, matches } from '../../core/shared/text-search.utils';

const OTHER = 'Egyéb';

@Component({
  standalone: true,
  selector: 'app-glossary',
  imports: [CommonModule, FormsModule],
  templateUrl: './glossary.component.html',
  styleUrl: './glossary.component.scss',
})
export class GlossaryComponent implements OnInit {
  auth = inject(AuthService);
  private glossaryService = inject(GlossaryService);
  private collator = new Intl.Collator('hu');

  glossaries = signal<Glossary[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);
  searchQuery = signal('');
  selectedCategory = signal('');
  expandedId = signal<number | null>(null);

  readonly skeletons = [1, 2, 3, 4, 5];

  canEdit = computed(() => this.auth.hasPermission('glossary-edit'));
  total = computed(() => this.glossaries().length);

  realCategories = computed(() => {
    const names = new Set<string>();
    for (const g of this.glossaries()) {
      const c = (g.category ?? '').trim();
      if (c) names.add(c);
    }
    return [...names].sort((a, b) => this.collator.compare(a, b));
  });

  private queryMatches = computed(() => {
    const q = this.searchQuery();
    return this.glossaries().filter((g) => matches(g.term, q) || matches(g.definition, q));
  });

  queryCount = computed(() => this.queryMatches().length);

  categories = computed(() => {
    const counts = new Map<string, number>();
    for (const g of this.queryMatches()) {
      const c = this.categoryOf(g);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const names = this.realCategories().filter((n) => n !== OTHER);
    if (this.glossaries().some((g) => this.categoryOf(g) === OTHER)) names.push(OTHER);
    return names.map((name) => ({ name, count: counts.get(name) ?? 0 }));
  });

  filtered = computed(() => {
    const cat = this.selectedCategory();
    const all = this.queryMatches();
    return cat ? all.filter((g) => this.categoryOf(g) === cat) : all;
  });

  groups = computed(() => {
    const map = new Map<string, Glossary[]>();
    for (const g of this.filtered()) {
      const c = this.categoryOf(g);
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(g);
    }
    return [...map.entries()]
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => this.collator.compare(a.term, b.term)),
      }))
      .sort((a, b) => {
        if (a.category === OTHER) return 1;
        if (b.category === OTHER) return -1;
        return this.collator.compare(a.category, b.category);
      });
  });

  hasFilters = computed(() => this.searchQuery().trim() !== '' || this.selectedCategory() !== '');

  isModalOpen = signal(false);
  isEditing = signal(false);
  saving = signal(false);
  saveError = signal<string | null>(null);
  currentGlossary: Glossary = { category: '', term: '', definition: '' };

  ngOnInit(): void {
    this.loadGlossaries();
  }

  loadGlossaries(): void {
    this.loadError.set(null);
    this.glossaryService.getGlossaries().subscribe({
      next: (data) => {
        this.glossaries.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.message || 'A fogalmak betöltése nem sikerült.');
      },
    });
  }

  categoryOf(g: Glossary): string {
    return (g.category ?? '').trim() || OTHER;
  }

  isOpen(id: number | undefined): boolean {
    return id !== undefined && this.expandedId() === id;
  }

  toggle(id: number | undefined): void {
    if (id === undefined) return;
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  highlight(text: string): Segment[] {
    return highlightSegments(text, this.searchQuery());
  }

  onlyInDefinition(g: Glossary): boolean {
    const q = this.searchQuery().trim();
    return q !== '' && !matches(g.term, q) && matches(g.definition, q);
  }

  setCategory(name: string): void {
    this.selectedCategory.set(name);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
  }

  openModal(glossary?: Glossary): void {
    this.isEditing.set(!!glossary);
    this.currentGlossary = glossary ? { ...glossary } : { category: '', term: '', definition: '' };
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.saving.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isModalOpen()) this.closeModal();
  }

  saveGlossary(): void {
    const g: Glossary = {
      ...this.currentGlossary,
      category: (this.currentGlossary.category ?? '').trim(),
      term: this.currentGlossary.term.trim(),
      definition: this.currentGlossary.definition.trim(),
    };
    if (!g.term || !g.definition) return;

    this.saving.set(true);
    this.saveError.set(null);

    const request: Observable<unknown> =
      this.isEditing() && g.id
        ? this.glossaryService.updateGlossary(g.id, g)
        : this.glossaryService.addGlossary(g);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadGlossaries();
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message || 'Hiba történt a mentés során.');
      },
    });
  }

  deleteGlossary(item: Glossary): void {
    if (!item.id) return;
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${item.term}" fogalmat?`)) return;

    this.glossaryService.deleteGlossary(item.id).subscribe({
      next: () => this.glossaries.update((list) => list.filter((g) => g.id !== item.id)),
      error: () => alert('A törlés nem sikerült. Nincs jogosultságod, vagy hiba történt.'),
    });
  }
}
