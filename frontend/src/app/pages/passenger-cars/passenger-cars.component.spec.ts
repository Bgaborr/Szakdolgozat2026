import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerCarsComponent } from './passenger-cars.component';

describe('PassengerCarsComponent', () => {
  let component: PassengerCarsComponent;
  let fixture: ComponentFixture<PassengerCarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerCarsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerCarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
