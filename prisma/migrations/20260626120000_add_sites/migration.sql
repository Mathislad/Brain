-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prospectId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateIndex
CREATE INDEX "Site_userId_idx" ON "Site"("userId");

-- CreateIndex
CREATE INDEX "Site_slug_idx" ON "Site"("slug");

-- CreateIndex
CREATE INDEX "SiteItem_userId_idx" ON "SiteItem"("userId");

-- CreateIndex
CREATE INDEX "SiteItem_siteId_idx" ON "SiteItem"("siteId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteItem" ADD CONSTRAINT "SiteItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (défense en profondeur, cohérent avec les autres tables)
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Site_select_own" ON "Site";
DROP POLICY IF EXISTS "Site_insert_own" ON "Site";
DROP POLICY IF EXISTS "Site_update_own" ON "Site";
DROP POLICY IF EXISTS "Site_delete_own" ON "Site";
CREATE POLICY "Site_select_own" ON "Site" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Site_insert_own" ON "Site" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Site_update_own" ON "Site" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Site_delete_own" ON "Site" FOR DELETE USING (auth.uid()::text = "userId");

ALTER TABLE "SiteItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SiteItem_select_own" ON "SiteItem";
DROP POLICY IF EXISTS "SiteItem_insert_own" ON "SiteItem";
DROP POLICY IF EXISTS "SiteItem_update_own" ON "SiteItem";
DROP POLICY IF EXISTS "SiteItem_delete_own" ON "SiteItem";
CREATE POLICY "SiteItem_select_own" ON "SiteItem" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "SiteItem_insert_own" ON "SiteItem" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "SiteItem_update_own" ON "SiteItem" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "SiteItem_delete_own" ON "SiteItem" FOR DELETE USING (auth.uid()::text = "userId");
