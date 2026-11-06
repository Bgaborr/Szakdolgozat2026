import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleUnitsComponent } from './multiple-units.component';

describe('MultipleUnitsComponent', () => {
  let component: MultipleUnitsComponent;
  let fixture: ComponentFixture<MultipleUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleUnitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
