export interface IS2SClient {
    post<T>(serviceUrl: string, endpoint: string, data: any, token: string): Promise<T>;
}

export const S2S_CLIENT = Symbol('S2S_CLIENT');
