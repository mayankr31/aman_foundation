# MOBILE_DEVELOPER_GUIDE.md

This document provides an exhaustive developer guide for building a React Native mobile application that consumes the Aman Foundation backend.

---

## 1. Project Overview

*   **Tech Stack:** Next.js Backend (Node.js API Routes), PostgreSQL, Prisma ORM. Mobile App to be built with React Native.
*   **Authentication System:** Custom JWT-based authentication. Passwords hashed using `bcryptjs`. Tokens passed in `Authorization` headers as `Bearer <token>`.
*   **Database Architecture:** PostgreSQL database managed by Prisma. Exhaustively documented below.
*   **State Management Approach:** Recommend React Context or Redux/Zustand on Mobile. Token persistence via `AsyncStorage` or `SecureStore`.
*   **File Upload/Storage System:** `multipart/form-data` uploads handled locally via Node.js `fs` in `/public/uploads` (e.g., Goat Events). No S3 bucket used.
*   **External Services:** None initially identified, standalone server structure.

---

## 2. Exhaustive Database Documentation

The following is an exhaustive list of all Prisma models used by the backend application.

### Role

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes | Unique |
| `description` | `String` | No |  |
| `displayInRegister` | `Boolean` | Yes | Default: true |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Role` &rarr; `User` (via `users`) - One-to-Many Relation
*   `Role` &rarr; `RolePermission` (via `permissions`) - One-to-Many Relation

### User

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes |  |
| `username` | `String` | Yes | Unique |
| `email` | `String` | Yes | Unique |
| `password` | `String` | Yes |  |
| `mobile` | `String` | No |  |
| `roleId` | `String` | Yes |  |
| `status` | `UserStatus` | Yes | Default: PENDING |
| `department` | `String` | No |  |
| `leavesTaken` | `Int` | Yes | Default: 0 |
| `leavesRemaining` | `Int` | Yes | Default: 15 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |
| `fellow` | `Fellow` | No |  |

**Relationships:**
*   `User` &rarr; `Role` (via `role`) - Foreign Key Relation
*   `User` &rarr; `UserPermission` (via `permissions`) - One-to-Many Relation
*   `User` &rarr; `Leave` (via `leaves`) - One-to-Many Relation
*   `User` &rarr; `InventoryLedger` (via `verifiedTransactions`) - One-to-Many Relation
*   `User` &rarr; `AttendanceLog` (via `attendanceLogs`) - One-to-Many Relation
*   `User` &rarr; `FellowTaskComment` (via `taskComments`) - One-to-Many Relation

### Permission

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `app` | `String` | Yes |  |
| `page` | `String` | Yes |  |
| `action` | `Action` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Permission` &rarr; `RolePermission` (via `roles`) - One-to-Many Relation
*   `Permission` &rarr; `UserPermission` (via `users`) - One-to-Many Relation

### RolePermission

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `roleId` | `String` | Yes |  |
| `permissionId` | `String` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `RolePermission` &rarr; `Role` (via `role`) - Foreign Key Relation
*   `RolePermission` &rarr; `Permission` (via `permission`) - Foreign Key Relation

### UserPermission

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `userId` | `String` | Yes |  |
| `permissionId` | `String` | Yes |  |
| `type` | `PermissionType` | Yes | Default: GRANT |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `UserPermission` &rarr; `User` (via `user`) - Foreign Key Relation
*   `UserPermission` &rarr; `Permission` (via `permission`) - Foreign Key Relation

### School

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes | Unique |
| `principalName` | `String` | No |  |
| `udiseCode` | `String` | No |  |
| `email` | `String` | No |  |
| `phone` | `String` | No |  |
| `address` | `String` | No |  |
| `location` | `String` | No |  |
| `status` | `String` | Yes | Default: "Active" |
| `latitude` | `String` | No |  |
| `longitude` | `String` | No |  |
| `mapUrl` | `String` | No |  |
| `img` | `String` | No |  |
| `goal` | `Int` | Yes | Default: 80 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `School` &rarr; `FellowSchool` (via `fellows`) - One-to-Many Relation
*   `School` &rarr; `Student` (via `students`) - One-to-Many Relation
*   `School` &rarr; `SchoolProgram` (via `programs`) - One-to-Many Relation

### Fellow

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes |  |
| `dob` | `DateTime` | No |  |
| `gender` | `String` | No |  |
| `email` | `String` | No | Unique |
| `phone` | `String` | No |  |
| `address` | `String` | No |  |
| `cohort` | `String` | Yes |  |
| `avatar` | `String` | No |  |
| `progress` | `Int` | Yes | Default: 0 |
| `evaluationRating` | `Float` | No |  |
| `userId` | `String` | No | Unique |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Fellow` &rarr; `User` (via `user`) - Foreign Key Relation
*   `Fellow` &rarr; `FellowSchool` (via `schools`) - One-to-Many Relation
*   `Fellow` &rarr; `Student` (via `students`) - One-to-Many Relation
*   `Fellow` &rarr; `FellowGoal` (via `goals`) - One-to-Many Relation
*   `Fellow` &rarr; `FellowReview` (via `reviews`) - One-to-Many Relation
*   `Fellow` &rarr; `FellowTask` (via `tasks`) - One-to-Many Relation

### FellowGoal

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `fellowId` | `String` | Yes |  |
| `title` | `String` | Yes |  |
| `targetDate` | `DateTime` | No |  |
| `status` | `String` | Yes | Default: "In Progress" |
| `review` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `FellowGoal` &rarr; `Fellow` (via `fellow`) - Foreign Key Relation
*   `FellowGoal` &rarr; `FellowGoalMilestone` (via `milestones`) - One-to-Many Relation

### FellowGoalMilestone

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `goalId` | `String` | Yes |  |
| `text` | `String` | Yes |  |
| `done` | `Boolean` | Yes | Default: false |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `FellowGoalMilestone` &rarr; `FellowGoal` (via `goal`) - Foreign Key Relation

### FellowReview

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `fellowId` | `String` | Yes |  |
| `period` | `String` | Yes |  |
| `evaluation` | `String` | Yes |  |
| `rating` | `Float` | No |  |
| `reviewerName` | `String` | Yes |  |
| `date` | `DateTime` | Yes | Default: now( |
| `status` | `String` | Yes | Default: "Completed" |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `FellowReview` &rarr; `Fellow` (via `fellow`) - Foreign Key Relation

### Student

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `studentId` | `String` | Yes | Unique |
| `name` | `String` | Yes |  |
| `dob` | `DateTime` | No |  |
| `gender` | `String` | No |  |
| `email` | `String` | No |  |
| `phone` | `String` | No |  |
| `address` | `String` | No |  |
| `grade` | `String` | Yes |  |
| `gradeGroup` | `String` | Yes |  |
| `district` | `String` | No |  |
| `attendance` | `Float` | Yes | Default: 0.0 |
| `guardianName` | `String` | No |  |
| `guardianPhone` | `String` | No |  |
| `enrolmentDate` | `DateTime` | No |  |
| `primaryLanguage` | `String` | No |  |
| `status` | `String` | Yes | Default: "On Track" |
| `schoolId` | `String` | No |  |
| `fellowId` | `String` | No |  |
| `isMigrated` | `Boolean` | Yes | Default: false |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Student` &rarr; `School` (via `school`) - Foreign Key Relation
*   `Student` &rarr; `Fellow` (via `fellow`) - Foreign Key Relation
*   `Student` &rarr; `StudentSubjectMark` (via `subjectMarks`) - One-to-Many Relation
*   `Student` &rarr; `StudentAttendanceLog` (via `attendanceLogs`) - One-to-Many Relation

### StudentSubjectMark

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `studentId` | `String` | Yes |  |
| `subject` | `String` | Yes |  |
| `score` | `Float` | Yes |  |
| `grade` | `String` | Yes |  |
| `remarks` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `StudentSubjectMark` &rarr; `Student` (via `student`) - Foreign Key Relation

### StudentAttendanceLog

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `studentId` | `String` | Yes |  |
| `month` | `String` | Yes |  |
| `present` | `Int` | Yes |  |
| `total` | `Int` | Yes |  |
| `percentage` | `Float` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `StudentAttendanceLog` &rarr; `Student` (via `student`) - Foreign Key Relation
*   `StudentAttendanceLog` &rarr; `StudentAttendanceDayLog` (via `dayLogs`) - One-to-Many Relation

### StudentAttendanceDayLog

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `logId` | `String` | Yes |  |
| `date` | `DateTime` | Yes |  |
| `status` | `String` | Yes | Default: "Present" |
| `note` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `StudentAttendanceDayLog` &rarr; `StudentAttendanceLog` (via `log`) - Foreign Key Relation

### FellowSchool

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `fellowId` | `String` | Yes |  |
| `schoolId` | `String` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |

**Relationships:**
*   `FellowSchool` &rarr; `Fellow` (via `fellow`) - Foreign Key Relation
*   `FellowSchool` &rarr; `School` (via `school`) - Foreign Key Relation

### Program

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `title` | `String` | Yes |  |
| `description` | `String` | No |  |
| `duration` | `String` | No |  |
| `participantsText` | `String` | No |  |
| `status` | `String` | Yes | Default: "Planning" |
| `icon` | `String` | No |  |
| `iconBg` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Program` &rarr; `SchoolProgram` (via `schools`) - One-to-Many Relation
*   `Program` &rarr; `ProgramEvent` (via `events`) - One-to-Many Relation

### SchoolProgram

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `schoolId` | `String` | Yes |  |
| `programId` | `String` | Yes |  |

**Relationships:**
*   `SchoolProgram` &rarr; `School` (via `school`) - Foreign Key Relation
*   `SchoolProgram` &rarr; `Program` (via `program`) - Foreign Key Relation

### ProgramEvent

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `programId` | `String` | No |  |
| `title` | `String` | Yes |  |
| `description` | `String` | No |  |
| `date` | `DateTime` | Yes |  |
| `location` | `String` | No |  |
| `status` | `String` | Yes | Default: "Scheduled" |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `ProgramEvent` &rarr; `Program` (via `program`) - Foreign Key Relation

### Beneficiary

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `enrolmentId` | `String` | Yes | Unique |
| `name` | `String` | Yes |  |
| `dob` | `DateTime` | No |  |
| `panCard` | `String` | No |  |
| `aadhar` | `String` | No |  |
| `rationCard` | `String` | No |  |
| `mobNumber` | `String` | No |  |
| `resilienceScore` | `Int` | Yes | Default: 50 |
| `annualIncome` | `Float` | No |  |
| `monthlyIncome` | `Float` | No |  |
| `caste` | `String` | No |  |
| `religion` | `String` | No |  |
| `address` | `String` | No |  |
| `householdSize` | `Int` | Yes | Default: 4 |
| `primaryIncomeType` | `String` | No |  |
| `tier` | `String` | Yes | Default: "Tier 2" |
| `tierPercent` | `Int` | Yes | Default: 50 |
| `bankName` | `String` | No |  |
| `bankAccountNo` | `String` | No |  |
| `bankIfsc` | `String` | No |  |
| `isMigrated` | `Boolean` | Yes | Default: false |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Beneficiary` &rarr; `FamilyMember` (via `familyMembers`) - One-to-Many Relation
*   `Beneficiary` &rarr; `Livestock` (via `livestock`) - One-to-Many Relation
*   `Beneficiary` &rarr; `SchemeEnrollment` (via `schemeEnrollments`) - One-to-Many Relation
*   `Beneficiary` &rarr; `BeneficiaryGoatRearing` (via `goatRearingDetails`) - One-to-Many Relation
*   `Beneficiary` &rarr; `BeneficiarySugarcane` (via `sugarcaneDetails`) - One-to-Many Relation
*   `Beneficiary` &rarr; `ResilienceSurvey` (via `resilienceSurveys`) - One-to-Many Relation
*   `Beneficiary` &rarr; `AdaptiveCapacitySurvey` (via `adaptiveCapacitySurveys`) - One-to-Many Relation
*   `Beneficiary` &rarr; `AbsorptiveCapacitySurvey` (via `absorptiveCapacitySurveys`) - One-to-Many Relation
*   `Beneficiary` &rarr; `TransformativeCapacitySurvey` (via `transformativeSurveys`) - One-to-Many Relation
*   `Beneficiary` &rarr; `VulnerabilitySurvey` (via `vulnerabilitySurveys`) - One-to-Many Relation
*   `Beneficiary` &rarr; `SolutionPlan` (via `solutionPlans`) - One-to-Many Relation

### FamilyMember

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `name` | `String` | Yes |  |
| `relation` | `String` | Yes |  |
| `dob` | `DateTime` | No |  |
| `contactInfo` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `FamilyMember` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

### Livestock

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `tagNumber` | `String` | Yes | Unique |
| `animalType` | `String` | Yes |  |
| `breed` | `String` | No |  |
| `ageMonths` | `Int` | No |  |
| `healthStatus` | `String` | Yes | Default: "Healthy" |
| `assignedAt` | `DateTime` | Yes | Default: now( |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Livestock` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation
*   `Livestock` &rarr; `LivestockHealthLog` (via `healthLogs`) - One-to-Many Relation

### LivestockHealthLog

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `livestockId` | `String` | Yes |  |
| `checkupDate` | `DateTime` | Yes | Default: now( |
| `status` | `String` | Yes |  |
| `notes` | `String` | No |  |
| `performedBy` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |

**Relationships:**
*   `LivestockHealthLog` &rarr; `Livestock` (via `livestock`) - Foreign Key Relation

### Scheme

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes | Unique |
| `description` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Scheme` &rarr; `SchemeEnrollment` (via `enrollments`) - One-to-Many Relation

### SchemeEnrollment

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `schemeId` | `String` | Yes |  |
| `enrolledAt` | `DateTime` | Yes | Default: now( |

**Relationships:**
*   `SchemeEnrollment` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation
*   `SchemeEnrollment` &rarr; `Scheme` (via `scheme`) - Foreign Key Relation

### BeneficiaryGoatRearing

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `goatsAssigned` | `Int` | Yes | Default: 0 |
| `investment` | `Float` | No |  |
| `returnsAmount` | `Float` | No |  |
| `roiPercentage` | `Float` | No |  |
| `advantagesLog` | `String` | No |  |
| `notes` | `String` | No |  |
| `goatRearingProgramId` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `BeneficiaryGoatRearing` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation
*   `BeneficiaryGoatRearing` &rarr; `GoatRearingProgram` (via `goatRearingProgram`) - Foreign Key Relation
*   `BeneficiaryGoatRearing` &rarr; `GoatRearingEvent` (via `events`) - One-to-Many Relation

### GoatRearingProgram

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes |  |
| `description` | `String` | No |  |
| `totalGoats` | `Int` | Yes | Default: 0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `GoatRearingProgram` &rarr; `BeneficiaryGoatRearing` (via `beneficiaries`) - One-to-Many Relation

### GoatRearingEvent

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryGoatRearingId` | `String` | Yes |  |
| `eventType` | `String` | Yes |  |
| `eventDate` | `DateTime` | Yes | Default: now( |
| `quantity` | `Int` | Yes | Default: 1 |
| `notes` | `String` | No |  |
| `photoUrl` | `String` | No |  |
| `recordedBy` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `GoatRearingEvent` &rarr; `BeneficiaryGoatRearing` (via `beneficiaryGoatRearing`) - Foreign Key Relation

### BeneficiarySugarcane

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `hectaresAllotted` | `Float` | Yes | Default: 0.0 |
| `soilType` | `String` | No |  |
| `waterSource` | `String` | No |  |
| `cropStage` | `String` | Yes | Default: "Planting" |
| `estimatedYieldTons` | `Float` | Yes | Default: 0.0 |
| `actualYieldTons` | `Float` | No |  |
| `fertilizersDistributed` | `String` | No |  |
| `estimatedRevenue` | `Float` | No |  |
| `actualRevenue` | `Float` | No |  |
| `sugarcaneProgramId` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `BeneficiarySugarcane` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation
*   `BeneficiarySugarcane` &rarr; `SugarcaneProgram` (via `sugarcaneProgram`) - Foreign Key Relation

### SugarcaneProgram

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes |  |
| `description` | `String` | No |  |
| `totalLandHectares` | `Float` | Yes | Default: 0.0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `SugarcaneProgram` &rarr; `BeneficiarySugarcane` (via `beneficiaries`) - One-to-Many Relation

### DisasterIncident

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes |  |
| `location` | `String` | Yes |  |
| `type` | `String` | Yes |  |
| `active` | `Boolean` | Yes | Default: true |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |
| `expectedFamiliesAffected` | `Int` | Yes | Default: 0 |
| `humanLossDied` | `Int` | Yes | Default: 0 |
| `humanLossInjured` | `Int` | Yes | Default: 0 |
| `humanLossMissing` | `Int` | Yes | Default: 0 |
| `propertyLossEstimate` | `Float` | Yes | Default: 0.0 |

**Relationships:**
*   `DisasterIncident` &rarr; `IncidentResourceNeed` (via `resourceNeeds`) - One-to-Many Relation

### HelpProvider

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `name` | `String` | Yes | Unique |
| `capabilityType` | `String` | Yes |  |
| `contactDetails` | `String` | Yes |  |
| `status` | `String` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

### ResourceItem

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `itemName` | `String` | Yes | Unique |
| `availableStock` | `Float` | Yes | Default: 0.0 |
| `unit` | `String` | Yes |  |
| `status` | `String` | Yes | Default: "Optimal" |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `ResourceItem` &rarr; `InventoryLedger` (via `ledgerTransactions`) - One-to-Many Relation
*   `ResourceItem` &rarr; `IncidentResourceNeed` (via `incidentNeeds`) - One-to-Many Relation

### InventoryLedger

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `resourceItemId` | `String` | Yes |  |
| `transactionType` | `String` | Yes |  |
| `quantity` | `Float` | Yes |  |
| `handledByUserId` | `String` | No |  |
| `incidentResourceNeedId` | `String` | No |  |
| `notes` | `String` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |

**Relationships:**
*   `InventoryLedger` &rarr; `ResourceItem` (via `resourceItem`) - Foreign Key Relation
*   `InventoryLedger` &rarr; `User` (via `handledByUser`) - Foreign Key Relation
*   `InventoryLedger` &rarr; `IncidentResourceNeed` (via `incidentResourceNeed`) - Foreign Key Relation

### AttendanceLog

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `userId` | `String` | Yes |  |
| `email` | `String` | No |  |
| `logdate` | `String` | No |  |
| `intimelog` | `String` | No |  |
| `outtimelog` | `String` | No |  |
| `workhours` | `String` | No |  |
| `workstatus` | `String` | No |  |
| `ef1` | `String` | No |  |
| `ef2` | `String` | No |  |
| `logininfo` | `String` | No |  |
| `logoutinfo` | `String` | No |  |
| `checkInLat` | `Float` | No |  |
| `checkInLng` | `Float` | No |  |
| `checkOutLat` | `Float` | No |  |
| `checkOutLng` | `Float` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `AttendanceLog` &rarr; `User` (via `user`) - Foreign Key Relation

### Leave

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `userId` | `String` | Yes |  |
| `type` | `String` | No |  |
| `dates` | `String` | No |  |
| `reason` | `String` | No |  |
| `rejectionReason` | `String` | No |  |
| `status` | `LeaveStatus` | Yes | Default: PENDING |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `Leave` &rarr; `User` (via `user`) - Foreign Key Relation

### IncidentResourceNeed

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `incidentId` | `String` | Yes |  |
| `resourceItemId` | `String` | Yes |  |
| `quantityNeeded` | `Float` | Yes | Default: 0.0 |
| `quantityReceived` | `Float` | Yes | Default: 0.0 |
| `transactionsCount` | `Int` | Yes | Default: 0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `IncidentResourceNeed` &rarr; `DisasterIncident` (via `incident`) - Foreign Key Relation
*   `IncidentResourceNeed` &rarr; `ResourceItem` (via `resourceItem`) - Foreign Key Relation
*   `IncidentResourceNeed` &rarr; `InventoryLedger` (via `transactions`) - One-to-Many Relation

### FellowTask

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `fellowId` | `String` | Yes |  |
| `title` | `String` | Yes |  |
| `description` | `String` | No |  |
| `plannedDate` | `DateTime` | Yes |  |
| `status` | `String` | Yes | Default: "Pending" |
| `isPlanned` | `Boolean` | Yes | Default: true |
| `completionDate` | `DateTime` | No |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `FellowTask` &rarr; `Fellow` (via `fellow`) - Foreign Key Relation
*   `FellowTask` &rarr; `FellowTaskComment` (via `comments`) - One-to-Many Relation

### FellowTaskComment

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `taskId` | `String` | Yes |  |
| `authorId` | `String` | Yes |  |
| `text` | `String` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `FellowTaskComment` &rarr; `FellowTask` (via `task`) - Foreign Key Relation
*   `FellowTaskComment` &rarr; `User` (via `author`) - Foreign Key Relation

### ResilienceSurvey

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `surveyDate` | `DateTime` | Yes | Default: now( |
| `responses` | `Json` | Yes |  |
| `lifeSatisfactionScore` | `Float` | Yes | Default: 0 |
| `planningScore` | `Float` | Yes | Default: 0 |
| `disasterReadinessScore` | `Float` | Yes | Default: 0 |
| `disasterBeliefsScore` | `Float` | Yes | Default: 0 |
| `disasterMindsetScore` | `Float` | Yes | Default: 0 |
| `financialResilienceScore` | `Float` | Yes | Default: 0 |
| `healthResilienceScore` | `Float` | Yes | Default: 0 |
| `socialConnectednessScore` | `Float` | Yes | Default: 0 |
| `socialProtectionScore` | `Float` | Yes | Default: 0 |
| `disasterWarningScore` | `Float` | Yes | Default: 0 |
| `vulnerabilityScore` | `Float` | Yes | Default: 0 |
| `overallScore` | `Float` | Yes | Default: 0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `ResilienceSurvey` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

### AdaptiveCapacitySurvey

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `surveyDate` | `DateTime` | Yes | Default: now( |
| `responses` | `Json` | Yes |  |
| `overallScore` | `Float` | Yes | Default: 0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `AdaptiveCapacitySurvey` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

### AbsorptiveCapacitySurvey

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `surveyDate` | `DateTime` | Yes | Default: now( |
| `responses` | `Json` | Yes |  |
| `overallScore` | `Float` | Yes | Default: 0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `AbsorptiveCapacitySurvey` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

### TransformativeCapacitySurvey

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `surveyDate` | `DateTime` | Yes | Default: now( |
| `responses` | `Json` | Yes |  |
| `overallScore` | `Float` | Yes | Default: 0 |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `TransformativeCapacitySurvey` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

### VulnerabilitySurvey

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `surveyDate` | `DateTime` | Yes | Default: now( |
| `responses` | `Json` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |

**Relationships:**
*   `VulnerabilitySurvey` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

### SolutionPlan

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `String` | Yes | Primary Key Default: uuid( |
| `beneficiaryId` | `String` | Yes |  |
| `createdAt` | `DateTime` | Yes | Default: now( |
| `updatedAt` | `DateTime` | Yes |  |
| `planData` | `Json` | Yes |  |

**Relationships:**
*   `SolutionPlan` &rarr; `Beneficiary` (via `beneficiary`) - Foreign Key Relation

---

## 3. Exhaustive API Documentation

This section exhaustively documents all endpoints found in the application. Standard Auth headers (`Authorization: Bearer <token>`) apply unless noted otherwise.

### Endpoint: `/api/attendance`
*   **Methods Supported:** `GET, POST, PATCH`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Various depending on endpoint context`

### Endpoint: `/api/attendance/[userId]`
*   **Methods Supported:** `GET`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Various depending on endpoint context`

### Endpoint: `/api/auth/login`
*   **Methods Supported:** `POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `User, Role`

### Endpoint: `/api/auth/signup`
*   **Methods Supported:** `POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `User, Role`

### Endpoint: `/api/beneficiaries`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]/absorptive-surveys`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]/adaptive-surveys`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]/resilience-surveys`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]/solution-plans`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]/transformative-surveys`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/beneficiaries/[id]/vulnerability-surveys`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Beneficiary, Schemes, Surveys`

### Endpoint: `/api/disaster-relief/alerts`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/help-providers`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/help-providers/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/incidents`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/incidents/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/ledger`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/resource-needs`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/resources`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/disaster-relief/resources/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `DisasterIncident, ResourceItem, HelpProvider`

### Endpoint: `/api/events`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `ProgramEvent`

### Endpoint: `/api/events/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `ProgramEvent`

### Endpoint: `/api/fellows`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Fellow, FellowGoal, FellowTask, FellowReview`

### Endpoint: `/api/fellows/[id]/goals`
*   **Methods Supported:** `POST, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Fellow, FellowGoal, FellowTask, FellowReview`

### Endpoint: `/api/fellows/[id]/reviews`
*   **Methods Supported:** `POST, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Fellow, FellowGoal, FellowTask, FellowReview`

### Endpoint: `/api/fellows/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Fellow, FellowGoal, FellowTask, FellowReview`

### Endpoint: `/api/fellows/[id]/tasks`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Fellow, FellowGoal, FellowTask, FellowReview`

### Endpoint: `/api/leaves`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Leave`

### Endpoint: `/api/leaves/[id]`
*   **Methods Supported:** `GET, PUT, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Leave`

### Endpoint: `/api/livelihood/goat-events`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `ProgramEvent`

### Endpoint: `/api/livelihood/goat-events/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `ProgramEvent`

### Endpoint: `/api/livelihood/programs`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `GoatRearingProgram, SugarcaneProgram`

### Endpoint: `/api/livelihood/programs/[type]/[id]/assignments`
*   **Methods Supported:** `POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `GoatRearingProgram, SugarcaneProgram`

### Endpoint: `/api/livelihood/programs/[type]/[id]`
*   **Methods Supported:** `GET`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `GoatRearingProgram, SugarcaneProgram`

### Endpoint: `/api/livestock`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Livestock, LivestockHealthLog`

### Endpoint: `/api/livestock/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Livestock, LivestockHealthLog`

### Endpoint: `/api/permissions`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Permission, RolePermission`

### Endpoint: `/api/programs`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Program`

### Endpoint: `/api/programs/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Program`

### Endpoint: `/api/roles`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Role`

### Endpoint: `/api/roles/[roleId]/permissions`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Permission, RolePermission`

### Endpoint: `/api/roles/[roleId]`
*   **Methods Supported:** `DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Role`

### Endpoint: `/api/schools`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `School, FellowSchool, SchoolProgram`

### Endpoint: `/api/schools/[id]/attendance/calendar`
*   **Methods Supported:** `GET`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `School, FellowSchool, SchoolProgram`

### Endpoint: `/api/schools/[id]/attendance`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `School, FellowSchool, SchoolProgram`

### Endpoint: `/api/schools/[id]/fellows`
*   **Methods Supported:** `GET, POST, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Fellow, FellowGoal, FellowTask, FellowReview`

### Endpoint: `/api/schools/[id]/programs`
*   **Methods Supported:** `GET, POST, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Program`

### Endpoint: `/api/schools/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `School, FellowSchool, SchoolProgram`

### Endpoint: `/api/schools/[id]/students`
*   **Methods Supported:** `GET, POST, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `School, FellowSchool, SchoolProgram`

### Endpoint: `/api/students`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Student, StudentAttendanceLog, StudentSubjectMark`

### Endpoint: `/api/students/[id]/attendance`
*   **Methods Supported:** `GET, POST, PUT, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Student, StudentAttendanceLog, StudentSubjectMark`

### Endpoint: `/api/students/[id]`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Student, StudentAttendanceLog, StudentSubjectMark`

### Endpoint: `/api/students/[id]/subjects`
*   **Methods Supported:** `GET, POST, PUT, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Student, StudentAttendanceLog, StudentSubjectMark`

### Endpoint: `/api/tasks/[id]/comments`
*   **Methods Supported:** `GET, POST`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `FellowTask, FellowTaskComment`

### Endpoint: `/api/tasks/[id]`
*   **Methods Supported:** `PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `FellowTask, FellowTaskComment`

### Endpoint: `/api/users/profile`
*   **Methods Supported:** `GET, PATCH`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `User, Role, Fellow`

### Endpoint: `/api/users`
*   **Methods Supported:** `GET`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `User, Role, Fellow`

### Endpoint: `/api/users/[id]/permissions`
*   **Methods Supported:** `GET, PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `Permission, RolePermission`

### Endpoint: `/api/users/[id]`
*   **Methods Supported:** `PATCH, DELETE`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `User, Role, Fellow`

### Endpoint: `/api/users/[id]/status`
*   **Methods Supported:** `PATCH`
*   **Authentication:** Required for most. (`/api/auth/login` and `/api/auth/signup` do not require auth).
*   **Database Models Used:** `User, Role, Fellow`

---

## 4. Complete Screen Inventory & Page-to-API Mapping

This lists all web routes exactly as implemented, outlining the equivalent screens the mobile app must implement.

| Web Route / Screen Path | Access Level | Purpose | Example API Calls (Deduced) |
| --- | --- | --- | --- |
| `/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/admin/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/beneficiaries/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/absorptive-capacity/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/adaptive-capacity/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/kyr-survey/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/responses/[surveyType]/[surveyId]/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/solution-board-reference/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/solution-plan/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/transformative-capacity/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/beneficiaries/[id]/vulnerability/` | Authenticated (mostly) | Beneficiary Management | `GET/POST /api/beneficiaries` |
| `/disaster-relief/` | Authenticated (mostly) | Disaster Relief Management | `GET /api/disaster-relief/incidents` |
| `/education/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/education/fellows/` | Authenticated (mostly) | Fellows Management | `GET /api/fellows` |
| `/education/fellows/[id]/` | Authenticated (mostly) | Fellows Management | `GET /api/fellows` |
| `/education/pta/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/education/pta/event/[id]/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/education/pta/program/[id]/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/education/schools/` | Authenticated (mostly) | Schools Management | `GET /api/schools` |
| `/education/schools/[id]/` | Authenticated (mostly) | Schools Management | `GET /api/schools` |
| `/education/students/` | Authenticated (mostly) | Students Management | `GET /api/students` |
| `/education/students/[id]/` | Authenticated (mostly) | Students Management | `GET /api/students` |
| `/hr/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/hr/attendance/` | Authenticated (mostly) | HR Attendance Tracking | `GET/POST /api/attendance` |
| `/hr/attendance/[userId]/` | Authenticated (mostly) | HR Attendance Tracking | `GET/POST /api/attendance` |
| `/hr/leaves/` | Authenticated (mostly) | HR Leaves Application | `GET/POST /api/leaves` |
| `/hr/leaves/apply/` | Authenticated (mostly) | HR Leaves Application | `GET/POST /api/leaves` |
| `/livelihood/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/livelihood/goat-rearing/` | Authenticated (mostly) | Goat Rearing Dashboard/Events | `GET/POST /api/livelihood/goat-events` |
| `/livelihood/goat-rearing/[id]/` | Authenticated (mostly) | Goat Rearing Dashboard/Events | `GET/POST /api/livelihood/goat-events` |
| `/livelihood/sugarcane/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/livelihood/sugarcane/[id]/` | Authenticated (mostly) | Dashboard/List/Detail Page | `Dependent on context` |
| `/login/` | Authenticated (mostly) | User Login | `POST /api/auth/login` |
| `/profile/` | Authenticated (mostly) | User Profile Management | `GET/PATCH /api/users/profile` |
| `/register/` | Authenticated (mostly) | User Registration | `POST /api/auth/signup` |


---

## 5. Authentication Flow

1.  **Login:** Send credentials (email/username, password) to `POST /api/auth/login`.
2.  **Token Reception:** Server verifies credentials (bcrypt compare) and returns a JSON response containing `data.token`.
3.  **Local Storage:** Mobile app stores token using `AsyncStorage` or `SecureStore`.
4.  **Authorized Requests:** All subsequent API calls append HTTP Header `Authorization: Bearer <stored_token>`.
5.  **Session Validation:** If an API responds with `401 Unauthorized`, Mobile App clears local token and navigates back to Login screen.
6.  **Logout:** App clears token from storage and routes to Login screen.

---

## 6. Feature Workflows

### Example Workflow: Goat Rearing Event (with Photo Upload)

1.  **User action:** Fellow navigates to Beneficiary Goat Rearing screen.
2.  **Data Fetch:** `GET /api/livelihood/goat-events?beneficiaryGoatRearingId=...`
3.  **User action:** Fellow taps "Add Event" and selects "Pregnancy" event type.
4.  **Photo Selection:** App launches camera/gallery to pick an image.
5.  **Submission:** Construct `FormData`:
    *   `beneficiaryGoatRearingId`: 'uuid'
    *   `eventType`: 'Pregnancy'
    *   `photo`: `{ uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' }`
6.  **API Call:** `POST /api/livelihood/goat-events` using `multipart/form-data`.
7.  **Refresh:** App re-fetches the goat events list to reflect the new addition.

---

## 7. Mobile App Requirements

### General Requirements
*   **Networking:** Must use dynamic `baseURL` derived from Environment Variables (do not hardcode).
*   **Error Handling:** Handle `400` (Validation), `401`/`403` (Auth), and `500` (Server Error) seamlessly via UI toasts/alerts.

### Critical Screen Priorities
1.  **High Priority:** Login, User Profile, Beneficiary Directory, Goat Rearing Events, HR Check-in (Attendance).
2.  **Medium Priority:** Education (Schools/Students), Leaves Application, Resilience Surveys.
3.  **Low Priority:** Disaster Relief management, Platform admin tools.

### Validation Rules
*   Passwords must match on signup.
*   Enrolment IDs are auto-generated or string-validated based on schema (e.g., BEN-XXX-X).

---

## 8. File Uploads

File uploads rely on `multipart/form-data` handling. 
**Important Endpoints with Uploads:**
*   `POST /api/livelihood/goat-events`

**Implementation:**
The Next.js backend uses native Node `fs` to write the uploaded file buffer to `/public/uploads/goat-events/` and returns a relative URL `/uploads/goat-events/filename.jpg`. Mobile applications should append the `baseURL` to these image paths when rendering `<Image source={{uri: ...}} />`.

---

## 9. Environment Variables

Mobile App `.env` required values:
*   `EXPO_PUBLIC_API_URL` (or equivalent): e.g., `https://aman-foundation.vercel.app`
*   (Do NOT include `JWT_SECRET` or `DATABASE_URL` in the mobile environment config.)
