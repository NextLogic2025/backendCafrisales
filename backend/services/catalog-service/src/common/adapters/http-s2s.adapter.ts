import { Injectable, ConflictException } from '@nestjs/common';
import axios from 'axios';
import { IS2SClient } from '../interfaces/s2s-client.interface';

@Injectable()
export class HttpS2SAdapter implements IS2SClient {
  async post<T>(serviceUrl: string, endpoint: string, data: any, token: string): Promise<T> {
    try {
      const url = `${serviceUrl}${endpoint}`;
      const res = await axios.post(url, data, { headers: { 'x-service-token': token } });
      return res.data as T;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) throw new ConflictException('Recurso ya existente en servicio remoto');
      throw err;
    }
  }

  async get<T>(serviceUrl: string, endpoint: string, token: string): Promise<T> {
    const url = `${serviceUrl}${endpoint}`;
    const res = await axios.get(url, { headers: { 'x-service-token': token } });
    return res.data as T;
  }
}
