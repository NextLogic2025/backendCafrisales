import { Injectable, ConflictException } from '@nestjs/common';
import axios from 'axios';
import { IS2SClient } from '../interfaces/s2s-client.interface';

@Injectable()
export class HttpS2SAdapter implements IS2SClient {
  private readonly timeoutMs: number;

  constructor() {
    const parsed = parseInt(process.env.S2S_TIMEOUT_MS || '10000', 10);
    this.timeoutMs = Number.isFinite(parsed) ? parsed : 10000;
  }

  async get<T>(serviceUrl: string, endpoint: string, token: string): Promise<T> {
    try {
      const url = `${serviceUrl}${endpoint}`;
      const res = await axios.get(url, { headers: { 'x-service-token': token }, timeout: this.timeoutMs });
      return res.data as T;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) throw new ConflictException('Recurso ya existente en servicio remoto');
      throw err;
    }
  }

  async post<T>(serviceUrl: string, endpoint: string, data: any, token: string): Promise<T> {
    try {
      const url = `${serviceUrl}${endpoint}`;
      const res = await axios.post(url, data, { headers: { 'x-service-token': token }, timeout: this.timeoutMs });
      return res.data as T;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) throw new ConflictException('Recurso ya existente en servicio remoto');
      throw err;
    }
  }
}
