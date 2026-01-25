import { IsEmail, IsNotEmpty, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserBaseDto } from './create-user-base.dto';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';

class PerfilDto {
  @IsNotEmpty()
  nombres: string;

  @IsNotEmpty()
  apellidos: string;

  @IsOptional()
  telefono?: string;
}

class ClienteDto {
  @IsNotEmpty()
  canal_id: string;

  @IsNotEmpty()
  nombre_comercial: string;

  @IsOptional()
  ruc?: string;

  @IsNotEmpty()
  zona_id: string;

  @IsNotEmpty()
  direccion: string;

  @IsOptional()
  latitud?: number;

  @IsOptional()
  longitud?: number;
  
  @IsOptional()
  condiciones?: {
    permite_negociacion?: boolean;
    porcentaje_descuento_max?: number;
    requiere_aprobacion_supervisor?: boolean;
    observaciones?: string;
  };
}

class SupervisorDto {
  @IsNotEmpty()
  codigo_empleado: string;
}

class VendedorDto {
  @IsNotEmpty()
  codigo_empleado: string;

  @IsOptional()
  supervisor_id?: string;
  
  @IsOptional()
  supervisor_email?: string;
}

class BodegueroDto {
  @IsNotEmpty()
  codigo_empleado: string;
}

export class CreateUserDto extends CreateUserBaseDto {
  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @IsOptional()
  avatarUrl?: string;

  @IsOptional()
  preferencias?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PerfilDto)
  perfil?: PerfilDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClienteDto)
  cliente?: ClienteDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SupervisorDto)
  supervisor?: SupervisorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VendedorDto)
  vendedor?: VendedorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BodegueroDto)
  bodeguero?: BodegueroDto;

  // convenience fields
  @IsOptional()
  codigoEmpleado?: string;

  @IsOptional()
  supervisorId?: string;
}
