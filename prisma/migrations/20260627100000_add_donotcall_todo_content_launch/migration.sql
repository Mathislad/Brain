-- ─── DoNotCall ────────────────────────────────────────────────────────────────
CREATE TABLE "DoNotCall" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoNotCall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DoNotCall_userId_normalizedPhone_key" ON "DoNotCall"("userId", "normalizedPhone");
CREATE INDEX "DoNotCall_userId_idx" ON "DoNotCall"("userId");

ALTER TABLE "DoNotCall" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DoNotCall_select_own" ON "DoNotCall" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "DoNotCall_insert_own" ON "DoNotCall" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "DoNotCall_update_own" ON "DoNotCall" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "DoNotCall_delete_own" ON "DoNotCall" FOR DELETE USING (auth.uid()::text = "userId");

-- ─── TodoItem ─────────────────────────────────────────────────────────────────
CREATE TABLE "TodoItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TodoItem_userId_idx" ON "TodoItem"("userId");
CREATE INDEX "TodoItem_userId_status_idx" ON "TodoItem"("userId", "status");

ALTER TABLE "TodoItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TodoItem_select_own" ON "TodoItem" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "TodoItem_insert_own" ON "TodoItem" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "TodoItem_update_own" ON "TodoItem" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "TodoItem_delete_own" ON "TodoItem" FOR DELETE USING (auth.uid()::text = "userId");

-- ─── ContentIdea ──────────────────────────────────────────────────────────────
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "angle" TEXT,
    "format" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "plannedSlotId" TEXT,
    "steps" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIdea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentIdea_userId_idx" ON "ContentIdea"("userId");

ALTER TABLE "ContentIdea" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ContentIdea_select_own" ON "ContentIdea" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "ContentIdea_insert_own" ON "ContentIdea" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "ContentIdea_update_own" ON "ContentIdea" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "ContentIdea_delete_own" ON "ContentIdea" FOR DELETE USING (auth.uid()::text = "userId");

-- ─── LaunchConfig ─────────────────────────────────────────────────────────────
CREATE TABLE "LaunchConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessions" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LaunchConfig_userId_key" ON "LaunchConfig"("userId");
CREATE INDEX "LaunchConfig_userId_idx" ON "LaunchConfig"("userId");

ALTER TABLE "LaunchConfig" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LaunchConfig_select_own" ON "LaunchConfig" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "LaunchConfig_insert_own" ON "LaunchConfig" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "LaunchConfig_update_own" ON "LaunchConfig" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "LaunchConfig_delete_own" ON "LaunchConfig" FOR DELETE USING (auth.uid()::text = "userId");
