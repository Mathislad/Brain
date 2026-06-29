CREATE TABLE IF NOT EXISTS "GoogleCalendarConnection" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "googleEmail"  TEXT,
  "accessToken"  TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenType"    TEXT,
  "scope"        TEXT,
  "expiresAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GoogleCalendarConnection_userId_key"
  ON "GoogleCalendarConnection"("userId");
CREATE INDEX IF NOT EXISTS "GoogleCalendarConnection_userId_idx"
  ON "GoogleCalendarConnection"("userId");

ALTER TABLE "GoogleCalendarConnection" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GoogleCalendarConnection_select_own" ON "GoogleCalendarConnection";
DROP POLICY IF EXISTS "GoogleCalendarConnection_insert_own" ON "GoogleCalendarConnection";
DROP POLICY IF EXISTS "GoogleCalendarConnection_update_own" ON "GoogleCalendarConnection";
DROP POLICY IF EXISTS "GoogleCalendarConnection_delete_own" ON "GoogleCalendarConnection";

CREATE POLICY "GoogleCalendarConnection_select_own"
ON "GoogleCalendarConnection"
FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "GoogleCalendarConnection_insert_own"
ON "GoogleCalendarConnection"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "GoogleCalendarConnection_update_own"
ON "GoogleCalendarConnection"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "GoogleCalendarConnection_delete_own"
ON "GoogleCalendarConnection"
FOR DELETE
USING (auth.uid()::text = "userId");
