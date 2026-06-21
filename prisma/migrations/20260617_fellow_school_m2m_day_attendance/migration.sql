-- DropForeignKey
ALTER TABLE "Fellow" DROP CONSTRAINT "Fellow_schoolId_fkey";

-- AlterTable
ALTER TABLE "Fellow" DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "School" DROP COLUMN "enrolled";

-- CreateTable
CREATE TABLE "StudentAttendanceDayLog" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Present',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAttendanceDayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowSchool" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FellowSchool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceDayLog_logId_date_key" ON "StudentAttendanceDayLog"("logId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FellowSchool_fellowId_schoolId_key" ON "FellowSchool"("fellowId", "schoolId");

-- AddForeignKey
ALTER TABLE "StudentAttendanceDayLog" ADD CONSTRAINT "StudentAttendanceDayLog_logId_fkey" FOREIGN KEY ("logId") REFERENCES "StudentAttendanceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowSchool" ADD CONSTRAINT "FellowSchool_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowSchool" ADD CONSTRAINT "FellowSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
