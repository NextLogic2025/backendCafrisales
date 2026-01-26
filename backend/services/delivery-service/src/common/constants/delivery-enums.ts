export enum EstadoEntrega {
    PENDIENTE = 'pendiente',
    EN_RUTA = 'en_ruta',
    ENTREGADO_COMPLETO = 'entregado_completo',
    ENTREGADO_PARCIAL = 'entregado_parcial',
    NO_ENTREGADO = 'no_entregado',
    CANCELADO = 'cancelado',
}

export enum TipoEvidencia {
    FOTO = 'foto',
    FIRMA = 'firma',
    DOCUMENTO = 'documento',
    AUDIO = 'audio',
    OTRO = 'otro',
}

export enum SeveridadIncidencia {
    BAJA = 'baja',
    MEDIA = 'media',
    ALTA = 'alta',
    CRITICA = 'critica',
}
