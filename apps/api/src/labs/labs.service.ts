import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RfcStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_RFC_STATUSES: RfcStatus[] = [
  RfcStatus.IN_DISCUSSION,
  RfcStatus.IN_BUILDING,
  RfcStatus.PUBLISHED,
];

const LAB_SELECT = {
  id: true,
  slug: true,
  name: true,
  glyph: true,
  description: true,
  order: true,
} satisfies Prisma.LabSelect;

@Injectable()
export class LabsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const labs = await this.prisma.lab.findMany({
      where: { isActive: true },
      select: {
        ...LAB_SELECT,
        _count: {
          select: {
            rfcs: { where: { status: { in: PUBLIC_RFC_STATUSES }, visibility: 'PUBLIC' } },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // buildersCount sai como 0 até a Etapa 3 (enrollments).
    return labs.map((l) => ({
      id: l.id,
      slug: l.slug,
      name: l.name,
      glyph: l.glyph,
      description: l.description,
      order: l.order,
      rfcsCount: l._count.rfcs,
      buildersCount: 0,
    }));
  }

  async findBySlug(slug: string) {
    const lab = await this.prisma.lab.findFirst({
      where: { slug, isActive: true },
      select: {
        ...LAB_SELECT,
        _count: {
          select: {
            rfcs: { where: { status: { in: PUBLIC_RFC_STATUSES }, visibility: 'PUBLIC' } },
          },
        },
      },
    });

    if (!lab) {
      throw new NotFoundException('lab not found');
    }

    return {
      id: lab.id,
      slug: lab.slug,
      name: lab.name,
      glyph: lab.glyph,
      description: lab.description,
      order: lab.order,
      rfcsCount: lab._count.rfcs,
      buildersCount: 0,
    };
  }
}
