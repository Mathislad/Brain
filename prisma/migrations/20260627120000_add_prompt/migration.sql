-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prompt_userId_idx" ON "Prompt"("userId");
CREATE INDEX "Prompt_userId_category_idx" ON "Prompt"("userId", "category");

-- RLS
ALTER TABLE "Prompt" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_select" ON "Prompt"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "prompt_insert" ON "Prompt"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "prompt_update" ON "Prompt"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "prompt_delete" ON "Prompt"
  FOR DELETE USING (auth.uid()::text = "userId");
