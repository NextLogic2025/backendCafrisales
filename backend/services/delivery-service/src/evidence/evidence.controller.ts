import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    ParseUUIDPipe,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EvidenceService } from './evidence.service';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/constants/rol-usuario.enum';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('evidencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
    constructor(private readonly evidenceService: EvidenceService) { }

    @Post('upload/:entregaId')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: process.env.UPLOAD_PATH || './uploads/evidence',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB max
            },
            fileFilter: (req, file, cb) => {
                const allowedMimes = [
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'application/pdf',
                    'audio/mpeg',
                    'audio/wav',
                ];
                if (!allowedMimes.includes(file.mimetype)) {
                    return cb(
                        new BadRequestException('Invalid file type. Allowed: JPG, PNG, PDF, MP3, WAV'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    uploadEvidence(
        @Param('entregaId', ParseUUIDPipe) entregaId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadDto: UploadEvidenceDto,
        @CurrentUser() user?: AuthUser,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Extrae coordenadas del body si están presentes
        const coordinates = {
            lat: uploadDto['latitud'] ? parseFloat(uploadDto['latitud']) : undefined,
            lng: uploadDto['longitud'] ? parseFloat(uploadDto['longitud']) : undefined,
        };

        return this.evidenceService.uploadEvidence(
            entregaId,
            file,
            uploadDto,
            user?.userId,
            coordinates,
        );
    }

    @Get('entrega/:entregaId')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    findByDelivery(@Param('entregaId', ParseUUIDPipe) entregaId: string) {
        return this.evidenceService.findByDelivery(entregaId);
    }

    @Get(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR, RolUsuario.TRANSPORTISTA)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.evidenceService.findOne(id);
    }

    @Delete(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.evidenceService.remove(id);
    }
}
