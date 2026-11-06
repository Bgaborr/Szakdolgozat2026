import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  PieController,
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { StatService } from '../../core/services/stat.service';
import { forkJoin } from 'rxjs';

Chart.register(
  PieController,
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-stat',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './stat.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stat.component.scss',
})
export class StatComponent implements OnInit {
  private statService = inject(StatService);
  public isDataLoaded = signal(false);

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e2e8f0', font: { family: 'Inter, sans-serif' } },
      },
    },
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { family: 'Inter, sans-serif' } },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          autoSkip: false,
          maxRotation: 70,
          minRotation: 70,
          font: { size: 12 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  // Mozdony
  public locoTractionData = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#fb923c', '#38bdf8', '#94a3b8'] }],
  });

  public locoStatusData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{ data: [], label: 'Állapot', backgroundColor: ['#4ade80', '#f87171'] }],
  });

  public locoTypesData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{ data: [], label: 'Darabszám', backgroundColor: ['#277D84'] }],
  });

  // Motorvonat
  public muTractionData = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#a855f7', '#10b981', '#64748b'] }],
  });

  public muStatusData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{ data: [], label: 'Állapot', backgroundColor: ['#4ade80', '#f59e0b'] }],
  });

  public muTypesData = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Darabszám',
        backgroundColor: ['#3b82f6', '#f43f5e', '#14b8a6', '#f59e0b', '#8b5cf6'],
      },
    ],
  });

  // Személykocsi
  public carCategoryData = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#d04141',
          '#c084fc',
          '#818cf8',
          '#22d3ee',
          '#a3e635',
          '#facc15',
          '#fb923c',
        ],
      },
    ],
  });

  public carVmaxData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{ data: [], label: 'Darabszám', backgroundColor: ['#c084fc'] }],
  });

  ngOnInit(): void {
    this.loadStats();
  }

  /** Új objektumot állít be a signalba, így a nézet biztosan frissül. */
  private applyData<T extends ChartType>(
    target: WritableSignal<ChartData<T>>,
    source: Record<string, number> | undefined | null,
  ): void {
    if (!source) return;
    target.update((d) => ({
      ...d,
      labels: Object.keys(source),
      datasets: [{ ...d.datasets[0], data: Object.values(source) as any }, ...d.datasets.slice(1)],
    }));
  }

  loadStats(): void {
    forkJoin({
      locomotives: this.statService.getLocomotiveStats(),
      passangerCars: this.statService.getPassengerCarStats(),
      multipleUnits: this.statService.getMultipleUnitStats(),
    }).subscribe({
      next: (results) => {
        const locoStats = results.locomotives;
        const carStats = results.passangerCars;
        const muStats = results.multipleUnits;

        this.applyData(this.locoTractionData, locoStats['traction']);
        this.applyData(this.locoStatusData, locoStats['status']);
        this.applyData(this.locoTypesData, locoStats['types']);

        this.applyData(this.muTractionData, muStats['traction']);
        this.applyData(this.muStatusData, muStats['status']);
        this.applyData(this.muTypesData, muStats['types']);

        this.applyData(this.carCategoryData, carStats['categories']);
        this.applyData(this.carVmaxData, carStats['vmax']);

        this.isDataLoaded.set(true);
      },
      error: (err) => {
        console.error('Stat adatok lekérése sikertelen', err);
      },
    });
  }
}
