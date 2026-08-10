/**
 * Makes a user-typed term safe to drop into `$regex`.
 *
 * Without this a customer searching for "12.50" matches any character where the dot
 * is, and a term like "(((((a+)+)+)$" is a regular expression the database will
 * happily spend a very long time evaluating.
 */
export const escapeRegex = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
