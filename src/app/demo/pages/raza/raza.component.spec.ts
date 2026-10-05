import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RazaComponent } from './raza.component';

describe('RazaComponent', () => {
  let component: RazaComponent;
  let fixture: ComponentFixture<RazaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RazaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RazaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
