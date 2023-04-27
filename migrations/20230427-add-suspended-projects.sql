ALTER TABLE "pings" ADD COLUMN "platform.counts.projects.suspended" INTEGER;
ALTER TABLE "pings" ALTER COLUMN "platform.counts.projects.suspended" SET DEFAULT 0;

