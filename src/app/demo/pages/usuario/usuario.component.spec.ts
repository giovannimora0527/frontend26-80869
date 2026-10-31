import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { UsuarioComponent } from './usuario.component';

describe('UsuarioComponent', () => {
  let component: UsuarioComponent;
  let fixture: ComponentFixture<UsuarioComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    http.expectOne((r) => r.url.endsWith('/usuario/listar')).flush([]);
    expect(component).toBeTruthy();
  });

  it('la contraseña es obligatoria al crear y opcional al editar', () => {
    http.expectOne((r) => r.url.endsWith('/usuario/listar')).flush([]);
    component.abrirCreacion();
    expect(component.form.controls.password.hasError('required')).toBeTrue();

    component.abrirEdicion({ id: 5, username: 'ana', email: 'ana@x.com', rol: 2, activo: true });
    expect(component.form.controls.password.valid).toBeTrue();
  });

  it('detecta contraseñas que no coinciden', () => {
    http.expectOne((r) => r.url.endsWith('/usuario/listar')).flush([]);
    component.abrirCreacion();
    component.form.patchValue({ password: 'abc123', confirmarPassword: 'abc124' });
    expect(component.form.hasError('noCoincide')).toBeTrue();
    component.form.patchValue({ confirmarPassword: 'abc123' });
    expect(component.form.hasError('noCoincide')).toBeFalse();
  });
});
