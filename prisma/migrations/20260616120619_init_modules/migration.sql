-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principalName" TEXT,
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
    "schoolId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubjectMark" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSubjectMark_pkey" PRIMARY KEY ("id")
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiaryGoatRearing_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "BroadcastAlert" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentByUserId" TEXT,

    CONSTRAINT "BroadcastAlert_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "DisasterIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffectedFamily" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "familyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "familySize" INTEGER NOT NULL DEFAULT 1,
    "aidRequirements" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffectedFamily_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "HelpProviderIncident" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,

    CONSTRAINT "HelpProviderIncident_pkey" PRIMARY KEY ("id")
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
    "donorProviderId" TEXT,
    "recipientFamilyId" TEXT,
    "recipientProviderId" TEXT,
    "handledByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fellow_email_key" ON "Fellow"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fellow_userId_key" ON "Fellow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

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
CREATE UNIQUE INDEX "BeneficiaryGoatRearing_beneficiaryId_key" ON "BeneficiaryGoatRearing"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "BeneficiarySugarcane_beneficiaryId_key" ON "BeneficiarySugarcane"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "HelpProvider_name_key" ON "HelpProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HelpProviderIncident_providerId_incidentId_key" ON "HelpProviderIncident"("providerId", "incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceItem_itemName_key" ON "ResourceItem"("itemName");

-- AddForeignKey
ALTER TABLE "Fellow" ADD CONSTRAINT "Fellow_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "StudentSubjectMark" ADD CONSTRAINT "StudentSubjectMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceLog" ADD CONSTRAINT "StudentAttendanceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "BeneficiarySugarcane" ADD CONSTRAINT "BeneficiarySugarcane_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastAlert" ADD CONSTRAINT "BroadcastAlert_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectedFamily" ADD CONSTRAINT "AffectedFamily_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpProviderIncident" ADD CONSTRAINT "HelpProviderIncident_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "HelpProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpProviderIncident" ADD CONSTRAINT "HelpProviderIncident_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_donorProviderId_fkey" FOREIGN KEY ("donorProviderId") REFERENCES "HelpProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_recipientFamilyId_fkey" FOREIGN KEY ("recipientFamilyId") REFERENCES "AffectedFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_recipientProviderId_fkey" FOREIGN KEY ("recipientProviderId") REFERENCES "HelpProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
