import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginatedResult, type PaginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search.query.dto';

type SearchHit = {
  id: string;
  number: number | null;
  slug: string;
  title: string;
  summary: string;
  locale: string;
  status: string;
  publishedAt: Date | null;
  rank: number;
  author: { id: string; username: string; fullName: string | null; avatarUrl: string | null };
  lab: { id: string; slug: string; name: string; glyph: string };
};

type SearchRow = {
  id: string;
  number: number | null;
  slug: string;
  title: string;
  summary: string;
  locale: string;
  status: string;
  published_at: Date | null;
  rank: number;
  author_id: string;
  author_username: string;
  author_full_name: string | null;
  author_avatar_url: string | null;
  lab_id: string;
  lab_slug: string;
  lab_name: string;
  lab_glyph: string;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto): Promise<PaginatedResult<SearchHit>> {
    const locale = query.locale ?? 'pt-BR';
    const offset = (query.page - 1) * query.limit;

    // regconfig do tsquery: precisa bater com o regconfig usado pelo trigger
    // que populou search_vector (função do Rfc.locale).
    const queryConfig: 'portuguese' | 'english' = locale === 'pt-BR' ? 'portuguese' : 'english';

    // Filtros condicionais via SQL fragments. Raw SQL porque @@ e ts_rank não
    // são expressivos no Prisma.
    const localeFilter = Prisma.sql`AND r.locale = ${locale}`;
    const labFilter = query.lab
      ? Prisma.sql`AND r."labId" = (SELECT id FROM "Lab" WHERE slug = ${query.lab} LIMIT 1)`
      : Prisma.empty;

    const tsquery = Prisma.sql`plainto_tsquery(${queryConfig}::regconfig, ${query.q})`;

    const rows = await this.prisma.$queryRaw<SearchRow[]>`
      SELECT
        r.id, r.number, r.slug, r.title, r.summary, r.locale, r.status,
        r."publishedAt" AS published_at,
        ts_rank(r.search_vector, ${tsquery}) AS rank,
        u.id AS author_id, u.username AS author_username,
        u."fullName" AS author_full_name, u."avatarUrl" AS author_avatar_url,
        l.id AS lab_id, l.slug AS lab_slug, l.name AS lab_name, l.glyph AS lab_glyph
      FROM "Rfc" r
      JOIN "User" u ON u.id = r."authorId"
      JOIN "Lab"  l ON l.id = r."labId"
      WHERE r.search_vector @@ ${tsquery}
        AND r.visibility = 'PUBLIC'
        AND r.status IN ('IN_DISCUSSION', 'IN_BUILDING', 'PUBLISHED')
        ${localeFilter}
        ${labFilter}
      ORDER BY rank DESC, r."publishedAt" DESC NULLS LAST
      LIMIT ${query.limit}
      OFFSET ${offset};
    `;

    const totalRows = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Rfc" r
      WHERE r.search_vector @@ ${tsquery}
        AND r.visibility = 'PUBLIC'
        AND r.status IN ('IN_DISCUSSION', 'IN_BUILDING', 'PUBLISHED')
        ${localeFilter}
        ${labFilter};
    `;
    const total = Number(totalRows[0]?.count ?? 0);

    const data: SearchHit[] = rows.map((r) => ({
      id: r.id,
      number: r.number,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      locale: r.locale,
      status: r.status,
      publishedAt: r.published_at,
      rank: Number(r.rank),
      author: {
        id: r.author_id,
        username: r.author_username,
        fullName: r.author_full_name,
        avatarUrl: r.author_avatar_url,
      },
      lab: { id: r.lab_id, slug: r.lab_slug, name: r.lab_name, glyph: r.lab_glyph },
    }));

    return buildPaginatedResult(data, total, query.page, query.limit);
  }
}
