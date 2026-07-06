export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export async function generateUniqueSlug(prisma, title) {
  const base = slugify(title);
  let slug = base;
  let count = 1;

  while (true) {
    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${base}-${count}`;
    count++;
  }

  return slug;
}
