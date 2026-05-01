import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LABS = [
  { slug: 'educacao', name: 'Lab. Educação', glyph: '◈', order: 1 },
  { slug: 'cidades', name: 'Lab. Cidades', glyph: '◇', order: 2 },
  { slug: 'saude', name: 'Lab. Saúde', glyph: '✚', order: 3 },
  { slug: 'cultura', name: 'Lab. Cultura', glyph: '♪', order: 4 },
  { slug: 'tec-civica', name: 'Lab. Tec. Cívica', glyph: '⌘', order: 5 },
  { slug: 'econ-solidaria', name: 'Lab. Econ. Solidária', glyph: '◆', order: 6 },
];

async function main(): Promise<void> {
  for (const lab of LABS) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      create: lab,
      update: { name: lab.name, glyph: lab.glyph, order: lab.order },
    });
  }
  console.log(`seeded ${LABS.length} labs`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
