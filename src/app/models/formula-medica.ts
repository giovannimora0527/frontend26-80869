/**
 * Interfaz que representa una fórmula médica en el sistema.
 * 
 * Describe los detalles de los medicamentos prescritos a un paciente
 * durante una cita médica, incluyendo sus identificadores, posología y fechas de auditoría.
 * 
 * @author Yulian Montealegre
 */
export interface FormulaMedica {
    /** Identificador único de la fórmula médica en la base de datos. */
    id: number;

    /** Identificador de la cita médica asociada a esta prescripción. */
    citaId: number;

    /** Identificador del medicamento prescrito en el catálogo o inventario. */
    medicamentoId: number;

    /** 
     * Nombre comercial o genérico del medicamento.
     * @optional Campo opcional para desnormalizar o mostrar información rápida en UI.
     */
    nombreMedicamento?: string;

    /** 
     * Descripción general del medicamento o detalles adicionales sobre la prescripción.
     * @optional
     */
    descripcion?: string;

    /** 
     * Forma farmacéutica o presentación del medicamento (ej. Jarabe, Tabletas 500mg, Ampolla).
     * @optional
     */
    presentacion?: string;

    /** Cantidad y concentración del medicamento administrado por toma (ej. "1 tableta de 500mg"). */
    dosis: string;

    /** Instrucciones para el paciente sobre frecuencia y duración del tratamiento (ej. "Cada 8 horas por 7 días"). */
    indicaciones: string;

    /** Fecha y hora en que se creó el registro en el sistema (formato ISO 8601 recomendado). */
    fechaCreacionRegistro: string;

    /** 
     * Fecha y hora de la última modificación del registro.
     * @optional
     */
    fechaActualizacionRegistro?: string;
}