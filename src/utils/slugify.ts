export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/** Appends a short random suffix so two products with the same name can coexist. */
export const uniqueSlug = (value: string): string =>
  `${slugify(value)}-${Math.random().toString(36).slice(2, 7)}`;
