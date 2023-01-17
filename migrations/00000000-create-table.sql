--- This creates the pings table
CREATE TABLE "pings" (
   "createdAt" TIMESTAMP not null,
   "weekYear" varchar(12),
   "weekStartDate" TIMESTAMP,
   "instanceId" varchar(256),
   "ip" varchar(256),
   "isDev" BOOLEAN,
   "env.flowforge" varchar(64),
   "env.nodejs" varchar(64),
   "os.arch" varchar(32),
   "os.release" varchar(128),
   "os.type" varchar(32),
   "platform.config.driver" varchar(32),
   "platform.counts.projects" INTEGER,
   "platform.counts.teams" INTEGER,
   "platform.counts.users" INTEGER,
   "platform.counts.devices" INTEGER,
   "platform.counts.projectSnapshots" INTEGER,
   "platform.counts.projectStacks" INTEGER,
   "platform.counts.projectTemplates" INTEGER,
   "platform.config.broker.enabled" BOOLEAN,
   "platform.config.email.enabled" BOOLEAN,
   "platform.config.fileStore.enabled" BOOLEAN
)