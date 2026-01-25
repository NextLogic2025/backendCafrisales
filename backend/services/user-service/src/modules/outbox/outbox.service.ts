import { Injectable } from '@nestjs/common';

@Injectable()
export class OutboxService {
  async processPending() {
    // placeholder for outbox processing
    return;
  }
}
