import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientsService {
  async createClient(data: any) {
    return { id: 'client-id-placeholder', ...data };
  }
}
