import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaMedicaComponent } from './historia-medica.component';

describe('HistoriaMedicaComponent', () => {
  let component: HistoriaMedicaComponent;
  let fixture: ComponentFixture<HistoriaMedicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaMedicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
