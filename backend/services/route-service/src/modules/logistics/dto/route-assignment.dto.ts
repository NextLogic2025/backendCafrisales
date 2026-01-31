import { IsUUID, IsNotEmpty } from 'class-validator';

export class RouteAssignmentDto {
    @IsNotEmpty()
    @IsUUID('4')
    driverId: string;
}
