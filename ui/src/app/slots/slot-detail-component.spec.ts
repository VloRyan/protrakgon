import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SlotDetailComponent} from './slot-detail-component';

describe('ActivityDetailComponent', () => {
  let component: SlotDetailComponent;
  let fixture: ComponentFixture<SlotDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
