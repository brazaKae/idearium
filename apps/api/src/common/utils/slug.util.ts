const MAX_SLUG_LENGTH = 100;

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    // remove diacritics (combining marks: U+0300..U+036F)
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH);

export const isValidSlug = (slug: string): boolean =>
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) &&
  slug.length >= 5 &&
  slug.length <= MAX_SLUG_LENGTH;
