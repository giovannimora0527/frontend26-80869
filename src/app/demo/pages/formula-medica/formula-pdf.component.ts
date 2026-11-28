import { Component, Input } from '@angular/core';

interface PersonaPdf {
  nombres?: string | null;
  apellidos?: string | null;
}

interface LineaFormulaPdf {
  medicamento?: { nombre?: string | null } | null;
  cantidadPrescrita?: number | null;
  viaAdministracion?: string | null;
  dosis?: string | null;
  frecuencia?: string | null;
  duracionTratamiento?: string | null;
  indicaciones?: string | null;
}

export interface FormulaParaPdf extends LineaFormulaPdf {
  id: number;
  fechaEmision?: string | null;
  fechaCreacionRegistro?: string | null;
  cita?: {
    id?: number;
    cliente?: PersonaPdf | null;
    mascota?: {
      nombreMascota?: string | null;
      nombre?: string | null;
      cliente?: PersonaPdf | null;
    } | null;
    medico?: (PersonaPdf & {
      registroProfesional?: string | null;
    }) | null;
  } | null;
  detalles?: LineaFormulaPdf[] | null;
}

@Component({
  selector: 'app-formula-pdf',
  standalone: true,
  template: `
    <button type="button"
            class="btn btn-outline-primary"
            [disabled]="generando"
            (click)="descargar()">
      {{ generando ? 'Generando PDF…' : 'Descargar fórmula en PDF' }}
    </button>

    @if (error) {
      <p class="text-danger mt-2 mb-0" role="alert">{{ error }}</p>
    }
  `
})
export class FormulaPdfComponent {
  @Input({ required: true }) formula!: FormulaParaPdf;

  generando = false;
  error = '';

  async descargar(): Promise<void> {
    if (this.generando || !this.formula?.id) return;

    this.generando = true;
    this.error = '';

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

      const formula = this.formula;
      const cita = formula.cita;
      const paciente = cita?.mascota;
      const propietario = cita?.cliente ?? paciente?.cliente;
      const medico = cita?.medico;

      // Las fórmulas antiguas pueden conservar el medicamento en la cabecera.
      const lineas = formula.detalles?.length
        ? formula.detalles
        : formula.medicamento ? [formula] : [];

      if (lineas.length === 0) {
        this.error = 'Esta fórmula todavía no tiene medicamentos para imprimir.';
        return;
      }

      const margen = 18;
      const ancho = pdf.internal.pageSize.getWidth();
      const alto = pdf.internal.pageSize.getHeight();
      const anchoTexto = ancho - margen * 2;
      let y = 0;

      const encabezado = () => {
        pdf.setFillColor(20, 92, 76);
        pdf.rect(0, 0, ancho, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(15);
        pdf.text('Clínica Veterinaria UNIMINUTO', margen, 13);
        pdf.setFontSize(11);
        pdf.text(`Fórmula médica #${formula.id}`, margen, 22);
        pdf.setTextColor(35, 45, 55);
        y = 42;
      };

      const espacio = (necesario: number) => {
        if (y + necesario > alto - 20) {
          pdf.addPage();
          encabezado();
        }
      };

      const escribir = (texto: string, negrita = false) => {
        const estilo = negrita ? 'bold' : 'normal';
        pdf.setFont('helvetica', estilo);
        pdf.setFontSize(11);
        const renglones: string[] = pdf.splitTextToSize(texto, anchoTexto);

        for (const renglon of renglones) {
          espacio(6);
          pdf.setFont('helvetica', estilo);
          pdf.setFontSize(11);
          pdf.text(renglon, margen, y);
          y += 6;
        }
      };

      encabezado();

      const fecha = formula.fechaEmision ?? formula.fechaCreacionRegistro;
      escribir(`Fecha de emisión: ${this.fechaLegible(fecha)}`);
      escribir(`Cita: ${cita?.id ?? 'Sin registrar'}`);
      escribir(`Paciente: ${paciente?.nombreMascota || paciente?.nombre || 'Sin registrar'}`);
      escribir(`Propietario: ${this.nombreCompleto(propietario)}`);
      escribir(`Veterinario: ${this.nombreCompleto(medico)}`);
      escribir(`Registro profesional: ${medico?.registroProfesional || 'Sin registrar'}`);

      y += 4;
      escribir('Medicamentos prescritos', true);

      for (const [indice, linea] of lineas.entries()) {
        espacio(24);
        y += 3;
        escribir(`${indice + 1}. ${linea.medicamento?.nombre || 'Medicamento sin nombre'}`, true);
        escribir(`Cantidad prescrita: ${linea.cantidadPrescrita ?? 'Sin registrar'}`);
        escribir(`Vía de administración: ${linea.viaAdministracion || 'Sin registrar'}`);
        escribir(`Dosis: ${linea.dosis || 'Sin registrar'}`);
        escribir(`Frecuencia: ${linea.frecuencia || 'Sin registrar'}`);
        escribir(`Duración del tratamiento: ${linea.duracionTratamiento || 'Sin registrar'}`);
        escribir(`Indicaciones: ${linea.indicaciones || 'Sin registrar'}`);
        y += 3;
      }

      const paginas = pdf.getNumberOfPages();
      for (let pagina = 1; pagina <= paginas; pagina++) {
        pdf.setPage(pagina);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(90, 100, 110);
        pdf.text(`Fórmula #${formula.id}`, margen, alto - 10);
        pdf.text(`Página ${pagina} de ${paginas}`, ancho - margen, alto - 10, {
          align: 'right'
        });
      }

      pdf.save(`formula-medica-${formula.id}.pdf`);
    } catch {
      this.error = 'No se pudo generar el PDF. Intenta descargarlo de nuevo.';
    } finally {
      this.generando = false;
    }
  }

  private nombreCompleto(persona?: PersonaPdf | null): string {
    return [persona?.nombres, persona?.apellidos]
      .filter(Boolean)
      .join(' ') || 'Sin registrar';
  }

  private fechaLegible(valor?: string | null): string {
    if (!valor) return 'Sin registrar';

    const fecha = valor.slice(0, 10);
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : fecha;
  }
}