import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocomotivesComponent } from './locomotives.component';

describe('LocomotivesComponent', () => {
  let component: LocomotivesComponent;
  let fixture: ComponentFixture<LocomotivesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocomotivesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocomotivesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
