-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TravelStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('READ', 'WRITE');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('GRANT', 'DENY');

-- CreateEnum
CREATE TYPE "LivelihoodCategory" AS ENUM ('FARM', 'NON_FARM');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayInRegister" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT,
    "roleId" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "department" TEXT,
    "leavesTaken" INTEGER NOT NULL DEFAULT 0,
    "leavesRemaining" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "app" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "type" "PermissionType" NOT NULL DEFAULT 'GRANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principalName" TEXT,
    "udiseCode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "latitude" TEXT,
    "longitude" TEXT,
    "mapUrl" TEXT,
    "img" TEXT,
    "goal" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fellow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "cohort" TEXT NOT NULL,
    "avatar" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "evaluationRating" DOUBLE PRECISION,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fellow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowGoal" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'In Progress',
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FellowGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowGoalMilestone" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FellowGoalMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowReview" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "evaluation" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FellowReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "grade" TEXT NOT NULL,
    "gradeGroup" TEXT NOT NULL,
    "district" TEXT,
    "attendance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "enrolmentDate" TIMESTAMP(3),
    "primaryLanguage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'On Track',
    "schoolId" TEXT,
    "fellowId" TEXT,
    "beneficiaryId" TEXT,
    "isMigrated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendanceLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "present" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAttendanceLog_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "LearningAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "canRead" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentHomework" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeworkStatus" TEXT NOT NULL DEFAULT 'NOT_DONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentHomework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTransition" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONTINUING_EDUCATION',
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationRecord" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "migrationType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "destination" TEXT NOT NULL,
    "migrationDate" TIMESTAMP(3) NOT NULL,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MigrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeRecord" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "incomeDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowSchool" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FellowSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT,
    "participantsText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planning',
    "icon" TEXT,
    "iconBg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProgram" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "SchoolProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramEvent" (
    "id" TEXT NOT NULL,
    "programId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "panCard" TEXT,
    "aadhar" TEXT,
    "rationCard" TEXT,
    "mobNumber" TEXT,
    "resilienceScore" INTEGER NOT NULL DEFAULT 50,
    "annualIncome" DOUBLE PRECISION,
    "monthlyIncome" DOUBLE PRECISION,
    "caste" TEXT,
    "religion" TEXT,
    "address" TEXT,
    "householdSize" INTEGER NOT NULL DEFAULT 4,
    "primaryIncomeType" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'Tier 2',
    "tierPercent" INTEGER NOT NULL DEFAULT 50,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankIfsc" TEXT,
    "isMigrated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livestock" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "animalType" TEXT NOT NULL,
    "breed" TEXT,
    "ageMonths" INTEGER,
    "healthStatus" TEXT NOT NULL DEFAULT 'Healthy',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivestockHealthLog" (
    "id" TEXT NOT NULL,
    "livestockId" TEXT NOT NULL,
    "checkupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivestockHealthLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeEnrollment" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemeEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficiaryGoatRearing" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "goatsAssigned" INTEGER NOT NULL DEFAULT 0,
    "investment" DOUBLE PRECISION,
    "returnsAmount" DOUBLE PRECISION,
    "roiPercentage" DOUBLE PRECISION,
    "advantagesLog" TEXT,
    "notes" TEXT,
    "goatRearingProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiaryGoatRearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoatRearingProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalGoats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoatRearingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoatRearingEvent" (
    "id" TEXT NOT NULL,
    "beneficiaryGoatRearingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "photoUrl" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoatRearingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficiarySugarcane" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "hectaresAllotted" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "soilType" TEXT,
    "waterSource" TEXT,
    "cropStage" TEXT NOT NULL DEFAULT 'Planting',
    "estimatedYieldTons" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "actualYieldTons" DOUBLE PRECISION,
    "fertilizersDistributed" TEXT,
    "estimatedRevenue" DOUBLE PRECISION,
    "actualRevenue" DOUBLE PRECISION,
    "sugarcaneProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiarySugarcane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SugarcaneProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalLandHectares" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SugarcaneProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivelihoodProgram" (
    "id" TEXT NOT NULL,
    "category" "LivelihoodCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalTarget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivelihoodProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficiaryLivelihood" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "notes" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiaryLivelihood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivelihoodEvent" (
    "id" TEXT NOT NULL,
    "livelihoodId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrl" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivelihoodEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterIncident" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expectedFamiliesAffected" INTEGER NOT NULL DEFAULT 0,
    "humanLossDied" INTEGER NOT NULL DEFAULT 0,
    "humanLossInjured" INTEGER NOT NULL DEFAULT 0,
    "humanLossMissing" INTEGER NOT NULL DEFAULT 0,
    "propertyLossEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "DisasterIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capabilityType" TEXT NOT NULL,
    "contactDetails" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "availableStock" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Optimal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLedger" (
    "id" TEXT NOT NULL,
    "resourceItemId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "handledByUserId" TEXT,
    "incidentResourceNeedId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "logdate" TEXT,
    "intimelog" TEXT,
    "outtimelog" TEXT,
    "workhours" TEXT,
    "workstatus" TEXT,
    "ef1" TEXT,
    "ef2" TEXT,
    "logininfo" TEXT,
    "logoutinfo" TEXT,
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "lessonPlanText" TEXT,
    "lessonPlanFiles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT,
    "dates" TEXT,
    "reason" TEXT,
    "rejectionReason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentResourceNeed" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "resourceItemId" TEXT NOT NULL,
    "quantityNeeded" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "quantityReceived" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "transactionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentResourceNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowTask" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "isPlanned" BOOLEAN NOT NULL DEFAULT true,
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FellowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FellowTaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FellowTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResilienceSurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "lifeSatisfactionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planningScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterReadinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterBeliefsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterMindsetScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialResilienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthResilienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialConnectednessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialProtectionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterWarningScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vulnerabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResilienceSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptiveCapacitySurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdaptiveCapacitySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsorptiveCapacitySurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsorptiveCapacitySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransformativeCapacitySurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransformativeCapacitySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VulnerabilitySurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VulnerabilitySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionPlan" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planData" JSONB NOT NULL,

    CONSTRAINT "SolutionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingRecord" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,
    "observationNotes" TEXT,
    "fileUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementSurvey" (
    "id" TEXT NOT NULL,
    "fellowId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL,
    "responses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "expectedExpenses" DOUBLE PRECISION NOT NULL,
    "status" "TravelStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelExpense" (
    "id" TEXT NOT NULL,
    "travelRequestId" TEXT NOT NULL,
    "actualExpense" DOUBLE PRECISION NOT NULL,
    "expenseDetails" JSONB,
    "receiptFiles" JSONB,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FLNCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FLNCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FLNQuestion" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FLNQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SELQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SELQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAssessmentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectAssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentForm" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fellowId" TEXT,
    "schoolId" TEXT,
    "assessmentType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isEnrolledInSchool" BOOLEAN,
    "reasonNotEnrolled" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentResponse" (
    "id" TEXT NOT NULL,
    "assessmentFormId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAssessmentResponse" (
    "id" TEXT NOT NULL,
    "assessmentFormId" TEXT NOT NULL,
    "subjectTemplateId" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectAssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FLNResponse" (
    "id" TEXT NOT NULL,
    "assessmentFormId" TEXT NOT NULL,
    "flnQuestionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FLNResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SELResponse" (
    "id" TEXT NOT NULL,
    "assessmentFormId" TEXT NOT NULL,
    "selQuestionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SELResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_app_page_action_key" ON "Permission"("app", "page", "action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fellow_email_key" ON "Fellow"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fellow_userId_key" ON "Fellow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceDayLog_logId_date_key" ON "StudentAttendanceDayLog"("logId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LearningAssessment_studentId_date_key" ON "LearningAssessment"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StudentHomework_studentId_date_key" ON "StudentHomework"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FellowSchool_fellowId_schoolId_key" ON "FellowSchool"("fellowId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProgram_schoolId_programId_key" ON "SchoolProgram"("schoolId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_enrolmentId_key" ON "Beneficiary"("enrolmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Livestock_tagNumber_key" ON "Livestock"("tagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Scheme_name_key" ON "Scheme"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeEnrollment_beneficiaryId_schemeId_key" ON "SchemeEnrollment"("beneficiaryId", "schemeId");

-- CreateIndex
CREATE INDEX "BeneficiaryLivelihood_beneficiaryId_idx" ON "BeneficiaryLivelihood"("beneficiaryId");

-- CreateIndex
CREATE INDEX "BeneficiaryLivelihood_programId_idx" ON "BeneficiaryLivelihood"("programId");

-- CreateIndex
CREATE INDEX "LivelihoodEvent_livelihoodId_idx" ON "LivelihoodEvent"("livelihoodId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpProvider_name_key" ON "HelpProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceItem_itemName_key" ON "ResourceItem"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentResourceNeed_incidentId_resourceItemId_key" ON "IncidentResourceNeed"("incidentId", "resourceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAssessmentResponse_assessmentFormId_subjectTemplateI_key" ON "SubjectAssessmentResponse"("assessmentFormId", "subjectTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "FLNResponse_assessmentFormId_flnQuestionId_key" ON "FLNResponse"("assessmentFormId", "flnQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "SELResponse_assessmentFormId_selQuestionId_key" ON "SELResponse"("assessmentFormId", "selQuestionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fellow" ADD CONSTRAINT "Fellow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowGoal" ADD CONSTRAINT "FellowGoal_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowGoalMilestone" ADD CONSTRAINT "FellowGoalMilestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "FellowGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowReview" ADD CONSTRAINT "FellowReview_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceLog" ADD CONSTRAINT "StudentAttendanceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceDayLog" ADD CONSTRAINT "StudentAttendanceDayLog_logId_fkey" FOREIGN KEY ("logId") REFERENCES "StudentAttendanceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAssessment" ADD CONSTRAINT "LearningAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAssessment" ADD CONSTRAINT "LearningAssessment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentHomework" ADD CONSTRAINT "StudentHomework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentHomework" ADD CONSTRAINT "StudentHomework_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransition" ADD CONSTRAINT "StudentTransition_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationRecord" ADD CONSTRAINT "MigrationRecord_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowSchool" ADD CONSTRAINT "FellowSchool_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowSchool" ADD CONSTRAINT "FellowSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProgram" ADD CONSTRAINT "SchoolProgram_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProgram" ADD CONSTRAINT "SchoolProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEvent" ADD CONSTRAINT "ProgramEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestock" ADD CONSTRAINT "Livestock_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestockHealthLog" ADD CONSTRAINT "LivestockHealthLog_livestockId_fkey" FOREIGN KEY ("livestockId") REFERENCES "Livestock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeEnrollment" ADD CONSTRAINT "SchemeEnrollment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeEnrollment" ADD CONSTRAINT "SchemeEnrollment_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryGoatRearing" ADD CONSTRAINT "BeneficiaryGoatRearing_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryGoatRearing" ADD CONSTRAINT "BeneficiaryGoatRearing_goatRearingProgramId_fkey" FOREIGN KEY ("goatRearingProgramId") REFERENCES "GoatRearingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoatRearingEvent" ADD CONSTRAINT "GoatRearingEvent_beneficiaryGoatRearingId_fkey" FOREIGN KEY ("beneficiaryGoatRearingId") REFERENCES "BeneficiaryGoatRearing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiarySugarcane" ADD CONSTRAINT "BeneficiarySugarcane_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiarySugarcane" ADD CONSTRAINT "BeneficiarySugarcane_sugarcaneProgramId_fkey" FOREIGN KEY ("sugarcaneProgramId") REFERENCES "SugarcaneProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryLivelihood" ADD CONSTRAINT "BeneficiaryLivelihood_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryLivelihood" ADD CONSTRAINT "BeneficiaryLivelihood_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LivelihoodProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivelihoodEvent" ADD CONSTRAINT "LivelihoodEvent_livelihoodId_fkey" FOREIGN KEY ("livelihoodId") REFERENCES "BeneficiaryLivelihood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_incidentResourceNeedId_fkey" FOREIGN KEY ("incidentResourceNeedId") REFERENCES "IncidentResourceNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentResourceNeed" ADD CONSTRAINT "IncidentResourceNeed_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentResourceNeed" ADD CONSTRAINT "IncidentResourceNeed_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowTask" ADD CONSTRAINT "FellowTask_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowTaskComment" ADD CONSTRAINT "FellowTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "FellowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FellowTaskComment" ADD CONSTRAINT "FellowTaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResilienceSurvey" ADD CONSTRAINT "ResilienceSurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptiveCapacitySurvey" ADD CONSTRAINT "AdaptiveCapacitySurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptiveCapacitySurvey" ADD CONSTRAINT "AbsorptiveCapacitySurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransformativeCapacitySurvey" ADD CONSTRAINT "TransformativeCapacitySurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerabilitySurvey" ADD CONSTRAINT "VulnerabilitySurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionPlan" ADD CONSTRAINT "SolutionPlan_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRecord" ADD CONSTRAINT "CoachingRecord_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRecord" ADD CONSTRAINT "CoachingRecord_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementSurvey" ADD CONSTRAINT "EngagementSurvey_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelExpense" ADD CONSTRAINT "TravelExpense_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLNQuestion" ADD CONSTRAINT "FLNQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FLNCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentForm" ADD CONSTRAINT "AssessmentForm_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentForm" ADD CONSTRAINT "AssessmentForm_fellowId_fkey" FOREIGN KEY ("fellowId") REFERENCES "Fellow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentForm" ADD CONSTRAINT "AssessmentForm_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentResponse" ADD CONSTRAINT "EnrollmentResponse_assessmentFormId_fkey" FOREIGN KEY ("assessmentFormId") REFERENCES "AssessmentForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssessmentResponse" ADD CONSTRAINT "SubjectAssessmentResponse_assessmentFormId_fkey" FOREIGN KEY ("assessmentFormId") REFERENCES "AssessmentForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssessmentResponse" ADD CONSTRAINT "SubjectAssessmentResponse_subjectTemplateId_fkey" FOREIGN KEY ("subjectTemplateId") REFERENCES "SubjectAssessmentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLNResponse" ADD CONSTRAINT "FLNResponse_assessmentFormId_fkey" FOREIGN KEY ("assessmentFormId") REFERENCES "AssessmentForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLNResponse" ADD CONSTRAINT "FLNResponse_flnQuestionId_fkey" FOREIGN KEY ("flnQuestionId") REFERENCES "FLNQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SELResponse" ADD CONSTRAINT "SELResponse_assessmentFormId_fkey" FOREIGN KEY ("assessmentFormId") REFERENCES "AssessmentForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SELResponse" ADD CONSTRAINT "SELResponse_selQuestionId_fkey" FOREIGN KEY ("selQuestionId") REFERENCES "SELQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
