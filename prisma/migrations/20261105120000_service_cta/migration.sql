-- Per-service closing call to action.
--
-- Written by hand rather than generated: the database was unreachable at the
-- time. `prisma migrate deploy` applies it normally once the server is back.
ALTER TABLE "Service" ADD COLUMN "ctaHeading" TEXT;
ALTER TABLE "Service" ADD COLUMN "ctaBody" TEXT;
