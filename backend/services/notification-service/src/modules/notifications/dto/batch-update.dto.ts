import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsBoolean } from 'class-validator';

export class BatchUpdateDto {
    @ApiProperty({ description: 'Lista de IDs de notificaciones', type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    ids: string[];

    @ApiProperty({ description: 'Marcar como leída (true) o no leída (false)' })
    @IsBoolean()
    isRead: boolean;
}
