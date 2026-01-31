export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    unreadCount?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginatedMeta;
}

export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    unreadCount?: number,
): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            unreadCount,
        },
    };
}
