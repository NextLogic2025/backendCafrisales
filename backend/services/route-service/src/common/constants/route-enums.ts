export enum EstadoRutero {
    BORRADOR = 'borrador',
    PUBLICADO = 'publicado',
    EN_CURSO = 'en_curso',
    COMPLETADO = 'completado',
    CANCELADO = 'cancelado',
}

export enum EstadoVehiculo {
    DISPONIBLE = 'disponible',
    ASIGNADO = 'asignado',
    MANTENIMIENTO = 'mantenimiento',
    FUERA_SERVICIO = 'fuera_servicio',
}

export enum ResultadoVisita {
    PEDIDO_TOMADO = 'pedido_tomado',
    NO_COMPRO = 'no_compro',
    NO_ATENDIDO = 'no_atendido',
    SEGUIMIENTO = 'seguimiento',
    COBRANZA = 'cobranza',
}

export enum TipoRutero {
    COMERCIAL = 'comercial',
    LOGISTICO = 'logistico',
}
