import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspecializacionComponent } from './especializacion.component';

describe('EspecializacionComponent', () => {
  let component: EspecializacionComponent;
  let fixture: ComponentFixture<EspecializacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspecializacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspecializacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
