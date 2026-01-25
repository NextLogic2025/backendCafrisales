export interface IOutboxTransport {
  dispatch(evento: any): Promise<void>;
}

export const OUTBOX_TRANSPORT = Symbol('OUTBOX_TRANSPORT');
