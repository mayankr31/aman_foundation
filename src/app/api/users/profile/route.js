import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";
import {
  validatePersonName,
  validateEmail,
  validateMobile,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateBankAccount,
  validateIfsc,
  validateRequired,
  validateDateNotFuture,
  firstError,
  normalizeMobileForSave,
  normalizeAadhaarForSave,
  normalizePanForSave,
  normalizeVoterIdForSave,
  normalizeIfscForSave,
  normalizeBankAccountForSave,
  normalizeEmailForSave,
} from "@/lib/validation";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
        manager: { select: { id: true, name: true, role: { select: { name: true } } } },
        directReports: {
          select: { id: true, name: true, status: true, role: { select: { name: true } } },
        },
        fellow: {
          include: {
            schools: {
              include: {
                school: true
              }
            },
            afterSchoolCentres: {
              include: {
                centre: true
              }
            },
            livelihoodPrograms: {
              include: {
                program: true
              }
            }
          }
        },
        managedSchools: { include: { school: true } },
        managedCentres: { include: { centre: true } },
        managedLivelihoodPrograms: { include: { program: true } },
      }
    });

    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password: _pw, ...safeUser } = fullUser;
    const permissions = await getEffectivePermissions(fullUser);
    return NextResponse.json({ success: true, data: { ...safeUser, permissions } });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const {
      name, email, mobile, address, gender, dob, avatar,
      maritalStatus, bloodGroup, emergencyContactName, emergencyContactPhone,
      aadharNumber, panCard, voterId, highestQualification, highestQualificationDetail,
      bankName, bankAccountNo, bankIfsc, dateOfJoining,
    } = body;

    const validationMessage = firstError([
      name !== undefined ? validatePersonName(name, { required: true }) : null,
      email !== undefined ? validateEmail(email, { required: true }) : null,
      mobile !== undefined ? validateMobile(mobile, { required: true }) : null,
      address !== undefined ? validateRequired(address, "Address") : null,
      gender !== undefined ? validateRequired(gender, "Gender") : null,
      dob !== undefined ? validateDateNotFuture(dob, { required: true, label: "Date of birth" }) : null,
      maritalStatus !== undefined ? validateRequired(maritalStatus, "Marital status") : null,
      bloodGroup !== undefined ? validateRequired(bloodGroup, "Blood group") : null,
      emergencyContactName !== undefined
        ? validatePersonName(emergencyContactName, { required: true })
        : null,
      emergencyContactPhone !== undefined
        ? validateMobile(emergencyContactPhone, { required: true })
        : null,
      aadharNumber !== undefined ? validateAadhaar(aadharNumber, { required: true }) : null,
      panCard !== undefined ? validatePan(panCard, { required: true }) : null,
      voterId !== undefined ? validateVoterId(voterId, { required: true }) : null,
      highestQualification !== undefined
        ? validateRequired(highestQualification, "Highest qualification")
        : null,
      highestQualification === "Other"
        ? validateRequired(highestQualificationDetail, "Specify qualification")
        : null,
      bankName !== undefined ? validateRequired(bankName, "Bank name") : null,
      bankAccountNo !== undefined ? validateBankAccount(bankAccountNo, { required: true }) : null,
      bankIfsc !== undefined ? validateIfsc(bankIfsc, { required: true }) : null,
      dateOfJoining ? validateDateNotFuture(dateOfJoining, { label: "Date of joining" }) : null,
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    // Update user details
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          name: name ? name.trim() : undefined,
          email: email ? normalizeEmailForSave(email) : undefined,
          mobile: mobile !== undefined ? normalizeMobileForSave(mobile) : undefined,
          // Store personal details directly on the User record (used by
          // Program Managers and other non-fellow roles).
          address: address !== undefined ? address : undefined,
          gender: gender !== undefined ? gender : undefined,
          dob: dob !== undefined ? (dob ? new Date(dob) : null) : undefined,
          avatar: avatar !== undefined ? avatar : undefined,
          maritalStatus: maritalStatus !== undefined ? maritalStatus : undefined,
          bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
          emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
          emergencyContactPhone: emergencyContactPhone !== undefined ? normalizeMobileForSave(emergencyContactPhone) : undefined,
          aadharNumber: aadharNumber !== undefined ? normalizeAadhaarForSave(aadharNumber) : undefined,
          panCard: panCard !== undefined ? normalizePanForSave(panCard) : undefined,
          voterId: voterId !== undefined ? normalizeVoterIdForSave(voterId) : undefined,
          highestQualification: highestQualification !== undefined ? highestQualification : undefined,
          highestQualificationDetail:
            highestQualification !== undefined
              ? highestQualification === "Other"
                ? String(highestQualificationDetail || "").trim()
                : null
              : undefined,
          bankName: bankName !== undefined ? bankName : undefined,
          bankAccountNo: bankAccountNo !== undefined ? normalizeBankAccountForSave(bankAccountNo) : undefined,
          bankIfsc: bankIfsc !== undefined ? normalizeIfscForSave(bankIfsc) : undefined,
          dateOfJoining: dateOfJoining !== undefined ? (dateOfJoining ? new Date(dateOfJoining) : null) : undefined,
        },
        include: {
          role: true,
          fellow: true
        }
      });

      if (u.fellow) {
        await tx.fellow.update({
          where: { id: u.fellow.id },
          data: {
            name: name ? name.trim() : undefined,
            email: email ? normalizeEmailForSave(email) : undefined,
            phone: mobile !== undefined ? normalizeMobileForSave(mobile) : undefined,
            address: address !== undefined ? address : undefined,
            gender: gender !== undefined ? gender : undefined,
            dob: dob !== undefined ? (dob ? new Date(dob) : null) : undefined,
            avatar: avatar !== undefined ? avatar : undefined,
          }
        });
      }

      // Re-fetch with full relations to return
      return await tx.user.findUnique({
        where: { id: user.id },
        include: {
          role: true,
          manager: { select: { id: true, name: true, role: { select: { name: true } } } },
          directReports: {
            select: { id: true, name: true, status: true, role: { select: { name: true } } },
          },
          fellow: {
            include: {
              schools: {
                include: {
                  school: true
                }
              },
              afterSchoolCentres: {
                include: {
                  centre: true
                }
              },
              livelihoodPrograms: {
                include: {
                  program: true
                }
              }
            }
          },
          managedSchools: { include: { school: true } },
          managedCentres: { include: { centre: true } },
          managedLivelihoodPrograms: { include: { program: true } },
        }
      });
    });

    const { password: _pw2, ...safeUpdatedUser } = updatedUser;
    return NextResponse.json({ success: true, data: safeUpdatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
