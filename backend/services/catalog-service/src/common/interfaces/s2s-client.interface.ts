export interface IS2SClient {
  post<T>(serviceUrl: string, endpoint: string, data: any, token: string): Promise<T>;
  get<T>(serviceUrl: string, endpoint: string, token: string): Promise<T>;
}

export const S2S_CLIENT = Symbol('S2S_CLIENT');
