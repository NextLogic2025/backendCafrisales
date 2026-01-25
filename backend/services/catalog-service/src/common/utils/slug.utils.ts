/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Converts a string to a URL-friendly slug
 * - Converts to lowercase
 * - Removes accents and special characters
 * - Replaces spaces with hyphens
 * - Removes consecutive hyphens
 * 
 * @example
 * slugify("Jamón de Espalda") // "jamon-de-espalda"
 * slugify("Mortadela Especial 500g") // "mortadela-especial-500g"
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Normalize to decomposed form
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/ñ/g, 'n') // Replace ñ with n
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace consecutive hyphens with single hyphen
}

/**
 * Generates a unique slug by appending a number if the base slug already exists
 * 
 * @param baseSlug - The initial slug to check
 * @param checkExists - Async function that returns true if slug exists
 * @returns A unique slug
 * 
 * @example
 * const slug = await ensureUniqueSlug("mortadela-especial", async (s) => {
 *   return await repo.findOne({ where: { slug: s } }) !== null;
 * });
 */
export async function ensureUniqueSlug(
    baseSlug: string,
    checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await checkExists(slug)) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }

    return slug;
}
