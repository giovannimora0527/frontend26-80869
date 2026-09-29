import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MascotaService } from '../mascota/service/mascota.service'
import { Mascota } from 'src/app/models/mascota';

@Component({
  selector: 'app-mascota',
  imports: [CommonModule],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent {  
  titleModule: string = "Componente administrativo para gestionar mascotas en el sistema";
  
  listMascotas: Mascota[] = [];

  constructor(private mascotaService: MascotaService) {
     this.listarMascota();
  }

  listarMascota() {
     this.mascotaService.listarMascotas()
     .subscribe({
        next: (data) => {
          this.listMascotas = data; 
          console.log(this.listMascotas);        
        },
        error: (error) => {
          console.error('Error al listar mascotas:', error);
        }
     });
  }
  

}
