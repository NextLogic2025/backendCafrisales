import { EntityManager } from 'typeorm';

export function isPgUniqueViolation(error: any): boolean {
    return !!(error && (error.code === '23505' || error.errno === 23505));
}

export async function insertOrIgnore(
    manager: EntityManager,
    tableName: string,
    values: Record<string, any>,
    conflictTarget?: string,
) {
    // If conflictTarget is provided, build a parametrized raw query
    if (conflictTarget) {
        const cols = Object.keys(values);
        const placeholders = cols.map((_, i) => `$${i + 1}`);
        const sql = `INSERT INTO ${tableName}(${cols.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT ${conflictTarget} DO NOTHING`;
        const params = cols.map(c => values[c]);
        return manager.query(sql, params);
    }

    // Otherwise try QueryBuilder .orIgnore()
    return manager
        .createQueryBuilder()
        .insert()
        .into(tableName)
        .values(values as any)
        .orIgnore()
        .execute();
}
