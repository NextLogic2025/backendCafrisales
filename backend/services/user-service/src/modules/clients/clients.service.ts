import { Injectable } from '@nestjs/common';

// Placeholder service for future client-related business logic.
// Currently basic controller uses repositories directly; keeping this
// service registered ensures it can be injected later and avoids pruning.
@Injectable()
export class ClientsService {
  async createClient(data: any) {
    return { id: 'client-id-placeholder', ...data };
  }
}
