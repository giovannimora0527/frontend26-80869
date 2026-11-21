import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MascotaService } from './service/mascota.service';
import { RazaService } from './service/raza.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { Mascota } from 'src/app/models/mascota';

import { MascotaComponent } from './mascota.component';

describe('MascotaComponent', () => {
  let component: MascotaComponent;
  let fixture: ComponentFixture<MascotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MascotaComponent],
      providers: [
        { provide: MascotaService, useValue: { listarMascotas: () => of([]) } },
        { provide: RazaService, useValue: { listarRazas: () => of([]) } },
        { provide: ClienteService, useValue: { listarClientes: () => of([]) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MascotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function mascota(nombre: string, activo?: boolean): Mascota {
    return { nombreMascota: nombre, activo, raza: { especie: 'Felino', nombre: 'Gato' }, cliente: { nombres: 'Juan' } };
  }

  it('should render green active and gray inactive or unknown statuses', () => {
    component.listMascotas = [mascota('A', true), mascota('B', false), mascota('C')];
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const badges = element.querySelectorAll('tbody .badge');
    expect(Array.from(badges).map(badge => badge.textContent?.trim())).toEqual(['Activo', 'Inactivo', 'No informado']);
    expect(badges[0].classList.contains('bg-success')).toBeTrue();
    expect(badges[0].classList.contains('bg-secondary')).toBeFalse();
    expect(badges[1].classList.contains('bg-secondary')).toBeTrue();
    expect(badges[1].classList.contains('bg-success')).toBeFalse();
    expect(badges[2].classList.contains('bg-secondary')).toBeTrue();
  });

  it('should filter by status labels or boolean text without confusing active and inactive', () => {
    component.listMascotas = [mascota('A', true), mascota('B', false), mascota('C')];
    for (const termino of [' ACTIVO ', 'true', 'inactivo', 'FALSE']) {
      component.terminoBusqueda = termino;
      expect(component.mascotasFiltradas.length).toBe(1);
      expect(component.mascotasFiltradas[0].activo).toBe([' ACTIVO ', 'true'].includes(termino));
    }
    component.terminoBusqueda = 'no informado';
    expect(component.mascotasFiltradas[0].nombreMascota).toBe('C');
  });

  it('should toggle status sorting and reset pagination', () => {
    component.listMascotas = [mascota('B', false), mascota('A', true)];
    component.paginaActual = 2;
    component.ordenarPor('estado');
    expect(component.paginaActual).toBe(1);
    expect(component.mascotasFiltradas.map(item => item.activo)).toEqual([true, false]);
    component.ordenarPor('estado');
    expect(component.mascotasFiltradas.map(item => item.activo)).toEqual([false, true]);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('th')[6].getAttribute('aria-sort')).toBe('descending');
    expect(component.listMascotas[0].activo).toBeFalse();
  });

  it('should paginate filtered statuses and reset the page through the search input', () => {
    component.listMascotas = Array.from({ length: 12 }, (_, indice) => mascota(`Mascota ${indice}`, indice < 6));
    component.paginaActual = 2;
    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector('input');
    if (!input) {
      fail('Search input is missing');
      return;
    }
    input.value = 'activo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.paginaActual).toBe(1);
    expect(component.totalPaginas).toBe(2);
    expect(component.mascotasPaginadas.length).toBe(5);
    component.cambiarPagina(2);
    expect(component.mascotasPaginadas.length).toBe(1);
    expect(component.mascotasPaginadas.every(item => item.activo === true)).toBeTrue();
  });
});
