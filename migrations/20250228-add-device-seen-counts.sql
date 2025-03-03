ALTER TABLE "pings" ADD COLUMN "platform.counts.devicesByLastSeen.never" integer DEFAULT 0;
ALTER TABLE "pings" ADD COLUMN "platform.counts.devicesByLastSeen.day" integer DEFAULT 0;

ALTER TABLE "pings" ADD COLUMN "platform.counts.remoteBrokers" integer DEFAULT 0;

