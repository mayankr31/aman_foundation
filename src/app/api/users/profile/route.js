import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
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
      aadharNumber, panCard, bankName, bankAccountNo, bankIfsc, dateOfJoining,
    } = body;

    // Update user details
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          name: name || undefined,
          email: email || undefined,
          mobile: mobile !== undefined ? mobile : undefined,
          // Store personal details directly on the User record (used by
          // Program Managers and other non-fellow roles).
          address: address !== undefined ? address : undefined,
          gender: gender !== undefined ? gender : undefined,
          dob: dob !== undefined ? (dob ? new Date(dob) : null) : undefined,
          avatar: avatar !== undefined ? avatar : undefined,
          maritalStatus: maritalStatus !== undefined ? maritalStatus : undefined,
          bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
          emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
          emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
          aadharNumber: aadharNumber !== undefined ? aadharNumber : undefined,
          panCard: panCard !== undefined ? panCard : undefined,
          bankName: bankName !== undefined ? bankName : undefined,
          bankAccountNo: bankAccountNo !== undefined ? bankAccountNo : undefined,
          bankIfsc: bankIfsc !== undefined ? bankIfsc : undefined,
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
            name: name || undefined,
            email: email || undefined,
            phone: mobile !== undefined ? mobile : undefined,
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
