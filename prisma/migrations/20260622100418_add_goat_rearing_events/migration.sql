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

-- AddForeignKey
ALTER TABLE "GoatRearingEvent" ADD CONSTRAINT "GoatRearingEvent_beneficiaryGoatRearingId_fkey" FOREIGN KEY ("beneficiaryGoatRearingId") REFERENCES "BeneficiaryGoatRearing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
