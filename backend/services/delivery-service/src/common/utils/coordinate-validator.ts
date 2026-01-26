import { BadRequestException } from '@nestjs/common';

export function validateCoordinates(lat?: number, lng?: number): void {
    if ((lat !== undefined && lng === undefined) || (lat === undefined && lng !== undefined)) {
        throw new BadRequestException('Latitud y longitud deben proporcionarse juntas o ninguna');
    }

    if (lat !== undefined && lng !== undefined) {
        if (lat < -90 || lat > 90) {
            throw new BadRequestException('Latitud debe estar entre -90 y 90');
        }
        if (lng < -180 || lng > 180) {
            throw new BadRequestException('Longitud debe estar entre -180 y 180');
        }
    }
}
