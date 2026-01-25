import { Injectable } from '@nestjs/common';

@Injectable()
export class OutboxService {
  async processPending() {
    // Placeholder: cron job to process outbox events
    return;
  }
}
