-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "visited" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "FlowConfig" ADD COLUMN     "draft" JSONB;

