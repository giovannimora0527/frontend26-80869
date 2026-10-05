import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaMedicaFormComponent } from './formula-medica-form.component';

describe('FormulaMedicaFormComponent', () => {
  let component: FormulaMedicaFormComponent;
  let fixture: ComponentFixture<FormulaMedicaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaMedicaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulaMedicaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
