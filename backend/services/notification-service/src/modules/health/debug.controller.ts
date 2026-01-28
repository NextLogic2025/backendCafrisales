import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@ApiTags('debug')
@Controller('debug')
export class DebugController {
    constructor(
        @InjectConnection() private mainConnection: Connection,
        @InjectConnection('orderConnection') private orderConnection: Connection,
    ) { }

    @Get('connections')
    @ApiOperation({ summary: 'Verificar estado de conexiones a bases de datos' })
    async checkConnections() {
        const mainConnected = this.mainConnection.isInitialized;
        const orderConnected = this.orderConnection.isInitialized;

        let mainDbName = 'unknown';
        let orderDbName = 'unknown';

        try {
            const mainResult = await this.mainConnection.query('SELECT current_database()');
            mainDbName = mainResult[0].current_database;
        } catch (error) {
            mainDbName = `Error: ${error.message}`;
        }

        try {
            const orderResult = await this.orderConnection.query('SELECT current_database()');
            orderDbName = orderResult[0].current_database;
        } catch (error) {
            orderDbName = `Error: ${error.message}`;
        }

        return {
            mainConnection: {
                connected: mainConnected,
                database: mainDbName,
            },
            orderConnection: {
                connected: orderConnected,
                database: orderDbName,
            },
            status: mainConnected && orderConnected ? 'OK' : 'ERROR',
        };
    }

    @Get('outbox-count')
    @ApiOperation({ summary: 'Contar eventos pendientes en outbox de pedidos' })
    async getOutboxCount() {
        try {
            const result = await this.orderConnection.query(`
        SELECT 
          COUNT(*) as total_eventos,
          COUNT(*) FILTER (WHERE procesado_en IS NULL) as pendientes,
          COUNT(*) FILTER (WHERE procesado_en IS NOT NULL) as procesados
        FROM app.outbox_eventos
      `);
            return result[0];
        } catch (error) {
            return {
                error: error.message,
            };
        }
    }
}
