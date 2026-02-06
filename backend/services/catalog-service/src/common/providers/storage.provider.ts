import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

@Injectable()
export class StorageProvider {
    private storage: Storage;
    private bucketName: string;
    private readonly logger = new Logger(StorageProvider.name);

    constructor(private configService: ConfigService) {
        this.storage = new Storage();
        // Hardcoded bucket name for production
        this.bucketName = 'gen-lang-client-0059045498-cafrisales-assets';
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        if (!this.bucketName) {
            throw new Error('GCS_BUCKET_NAME is not configured');
        }

        const bucket = this.storage.bucket(this.bucketName);
        const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

        const fileName = `${folder}/${randomName}${extname(file.originalname)}`;
        const blob = bucket.file(fileName);

        const stream = blob.createWriteStream({
            resumable: false,
            gzip: true,
            metadata: {
                contentType: file.mimetype,
            },
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                this.logger.error(`Error uploading file to GCS: ${err.message}`, err.stack);
                reject(err);
            });

            stream.on('finish', () => {
                // Asumiendo que el bucket es publico o usamos signedUrl.
                // Si es publico: https://storage.googleapis.com/BUCKET_NAME/FILE_NAME
                const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
                resolve(publicUrl);
            });

            stream.end(file.buffer);
        });
    }
}
