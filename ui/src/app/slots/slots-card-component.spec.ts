import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotsCardComponent } from './slots-card-component';

describe('ActivitiesCardComponent', () => {
  let component: SlotsCardComponent;
  let fixture: ComponentFixture<SlotsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
