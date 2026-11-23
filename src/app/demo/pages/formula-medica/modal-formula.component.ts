import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Input, Output, ViewChild
} from '@angular/core';

@Component({
  selector: 'app-modal-formula',
  standalone: true,
  template: `
    <dialog #ventana class="ventana-formula"
            [attr.aria-label]="titulo"
            (cancel)="cancelar($event)">
      <div class="barra-cierre">
        <button type="button" class="btn-close" aria-label="Cerrar formulario"
                [disabled]="guardando" (click)="solicitarCierre()"></button>
      </div>
      <ng-content></ng-content>
    </dialog>
  `,
  styles: [`
    .ventana-formula {
      width: min(820px, calc(100vw - 24px));
      max-height: calc(100dvh - 40px);
      margin: auto;
      padding: 1rem;
      overflow-y: auto;
      border: 0;
      border-radius: 12px;
      color: inherit;
      background: white;
      box-shadow: 0 16px 55px rgb(0 0 0 / 24%);
    }

    .ventana-formula::backdrop {
      background: rgb(20 30 45 / 55%);
    }

    .barra-cierre {
      display: flex;
      justify-content: flex-end;
      margin-bottom: .5rem;
    }
  `]
})
export class ModalFormulaComponent implements AfterViewInit {
  @Input() titulo = 'Nueva fórmula médica';
  @Input() guardando = false;
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('ventana', { static: true })
  private ventana!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    this.ventana.nativeElement.showModal();
  }

  cancelar(evento: Event): void {
    evento.preventDefault();
    this.solicitarCierre();
  }

  solicitarCierre(): void {
    if (!this.guardando) {
      this.cerrar.emit();
    }
  }
}
