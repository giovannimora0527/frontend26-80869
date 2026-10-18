import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaMedicaListComponent } from './formula-medica-list.component';

describe('FormulaMedicaListComponent', () => {
  let component: FormulaMedicaListComponent;
  let fixture: ComponentFixture<FormulaMedicaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaMedicaListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulaMedicaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
