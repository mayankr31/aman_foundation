import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

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
    return NextResponse.json({ success: true, data: safeUser });
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
    const { name, email, mobile, address, gender, dob, avatar } = body;

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
            dob: dob ? new Date(dob) : null,
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
