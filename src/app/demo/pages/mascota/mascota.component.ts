import { Component } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mascota',
  imports: [],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent {

  tituloPersonalizado: string = "Crear nueva mascota";
  maxFilas: number = 3;

  saludar() {
    Swal.fire({
      title: 'Hola mundo',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

  saludar2(personaNombre: string) {
      console.log("La variable => " + personaNombre);
  }

}
