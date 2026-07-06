ALTER TABLE "TodoItem" ADD COLUMN "prospectId" TEXT;

CREATE INDEX "TodoItem_prospectId_idx" ON "TodoItem"("prospectId");

ALTER TABLE "TodoItem"
ADD CONSTRAINT "TodoItem_prospectId_fkey"
FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
