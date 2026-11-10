export class MedicoRq {
    id?: number;
    tipoDocumento!: string;
    numeroDocumento!: string;
    nombres!: string;
    apellidos!: string;
    telefono!: string;
    registroProfesional!: string;
    especializacionId!: number;
    // Usuario del sistema asociado al medico (opcional). Permite que el medico
    // vea sus citas en el calendario al iniciar sesion.
    usuarioId?: number | null;
}
