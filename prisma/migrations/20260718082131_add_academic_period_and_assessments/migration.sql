-- AlterTable
ALTER TABLE "StudentSubjectMark" ADD COLUMN     "academicGrade" TEXT,
ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "month" TEXT;

-- CreateTable
CREATE TABLE "StudentAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "academicYear" TEXT,
    "academicGrade" TEXT,
    "month" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAssessment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
