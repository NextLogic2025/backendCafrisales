import { IsNotEmpty } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  nombre: string;

  @IsNotEmpty()
  ruc: string;

  // coords as GeoJSON or simple lat/lng
  coords?: { lat: number; lng: number };
}
