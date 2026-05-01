-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnRfcs" (
    "rfcId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagsOnRfcs_pkey" PRIMARY KEY ("rfcId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "TagsOnRfcs_tagId_idx" ON "TagsOnRfcs"("tagId");

-- AddForeignKey
ALTER TABLE "TagsOnRfcs" ADD CONSTRAINT "TagsOnRfcs_rfcId_fkey" FOREIGN KEY ("rfcId") REFERENCES "Rfc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnRfcs" ADD CONSTRAINT "TagsOnRfcs_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Coluna + trigger para Full-Text Search bilíngue (pt-BR + en).
-- Não é GENERATED porque to_tsvector com regconfig dinâmico não é immutable;
-- usamos trigger BEFORE INSERT/UPDATE para popular search_vector.
ALTER TABLE "Rfc" ADD COLUMN search_vector tsvector;

CREATE INDEX rfc_search_vector_idx ON "Rfc" USING GIN(search_vector);

CREATE OR REPLACE FUNCTION rfc_search_vector_update() RETURNS trigger AS $$
DECLARE
  cfg regconfig;
BEGIN
  cfg := CASE WHEN NEW.locale = 'pt-BR' THEN 'portuguese' ELSE 'english' END::regconfig;
  NEW.search_vector :=
    setweight(to_tsvector(cfg, coalesce(NEW.title, '')),   'A') ||
    setweight(to_tsvector(cfg, coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector(cfg, coalesce(NEW.body, '')),    'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfc_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, summary, body, locale ON "Rfc"
FOR EACH ROW EXECUTE FUNCTION rfc_search_vector_update();
