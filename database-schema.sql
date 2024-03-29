--- This is the schema used to create the pings table

CREATE TABLE "pings" (
   "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   "instanceId" varchar(256),
   "ip" varchar(256),
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
   "platform.config.fileStore.enabled" BOOLEAN,
   "platform.counts.libraryEntries" INTEGER,
   "platform.counts.sharedLibraryEntries" INTEGER,
   "platform.license.id" varchar(256),
   "platform.license.type" varchar(16),
   "platform.counts.projects.suspended" INTEGER DEFAULT 0,
   PRIMARY KEY ("created_at", "instanceId")
)
