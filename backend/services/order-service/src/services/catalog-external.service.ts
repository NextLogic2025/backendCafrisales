import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IS2SClient, S2S_CLIENT } from '../common/interfaces/s2s-client.interface';
import type { CatalogSkuSnapshot } from '../common/interfaces/catalog-sku-snapshot.interface';

@Injectable()
export class CatalogExternalService {
    private readonly logger = new Logger(CatalogExternalService.name);
    private readonly catalogServiceUrl: string;
    private readonly serviceToken: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(S2S_CLIENT) private readonly s2sClient: IS2SClient,
    ) {
        this.catalogServiceUrl =
            this.configService.get('CATALOG_SERVICE_URL') ||
            process.env.CATALOG_SERVICE_URL ||
            'http://catalog-service:3000';

        this.serviceToken =
            this.configService.get('SERVICE_TOKEN') ||
            process.env.SERVICE_TOKEN ||
            '';
    }

    /**
     * Get SKU information by ID
     */
    async getSkuById(skuId: string): Promise<any> {
        try {
            const sku = await this.s2sClient.get<any>(
                this.catalogServiceUrl,
                `/api/internal/skus/${skuId}`,
                this.serviceToken,
            );
            return sku;
        } catch (error) {
            this.logger.warn(`Failed to fetch SKU ${skuId} from catalog-service: ${error.message}`);
            return null;
        }
    }

    /**
     * Get multiple SKUs by IDs
     */
    async getSkusByIds(skuIds: string[]): Promise<any[]> {
        const promises = skuIds.map((id) => this.getSkuById(id));
        const results = await Promise.allSettled(promises);
        return results
            .filter((r) => r.status === 'fulfilled' && r.value !== null)
            .map((r: any) => r.value);
    }

    async getSkuSnapshot(skuId: string): Promise<CatalogSkuSnapshot | null> {
        const sku = await this.getSkuById(skuId);
        if (!sku) {
            return null;
        }

        const baseNombre = sku.nombre ?? sku.name ?? 'Sin nombre';
        const productoNombre =
            sku.producto_nombre ??
            sku.productoNombre ??
            sku.producto?.nombre ??
            sku.product?.name ??
            sku.productName;
        const nombre = productoNombre && baseNombre && !String(baseNombre).includes(productoNombre)
            ? `${productoNombre} - ${baseNombre}`
            : baseNombre;
        const codigo = sku.codigo ?? sku.code ?? sku.sku ?? 'SIN-CODIGO';
        const peso = sku.peso_gramos ?? sku.peso ?? sku.pesoGramos ?? 0;
        const tipo = sku.tipo_empaque ?? sku.tipoEmpaque ?? 'desconocido';
        const precio =
            sku.precio_vigente ??
            sku.precio ??
            sku.price ??
            (Array.isArray(sku.precios)
                ? Number(sku.precios.find((p) => !p.vigente_hasta)?.precio ?? sku.precios[0]?.precio ?? 0)
                : 0);

        return {
            sku_id: skuId,
            nombre,
            codigo,
            peso_gramos: Number(peso),
            tipo_empaque: tipo,
            precio_unitario: Number(precio),
        };
    }

    async getSkuSnapshots(skuIds: string[]): Promise<CatalogSkuSnapshot[]> {
        const results = await Promise.allSettled(skuIds.map((id) => this.getSkuSnapshot(id)));
        return results
            .filter((result): result is PromiseFulfilledResult<CatalogSkuSnapshot> => result.status === 'fulfilled' && result.value !== null)
            .map((result) => result.value);
    }
}
