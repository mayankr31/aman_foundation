import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Starting comprehensive seeding...");

  // --- 0. CLEAR EXISTING TABLES ---
  console.log("Clearing existing tables...");
  await prisma.inventoryLedger.deleteMany({});
  await prisma.resourceItem.deleteMany({});
  await prisma.helpProvider.deleteMany({});
  await prisma.disasterIncident.deleteMany({});

  await prisma.beneficiarySugarcane.deleteMany({});
  await prisma.beneficiaryGoatRearing.deleteMany({});
  await prisma.sugarcaneProgram.deleteMany({});
  await prisma.goatRearingProgram.deleteMany({});
  await prisma.livestockHealthLog.deleteMany({});
  await prisma.livestock.deleteMany({});
  await prisma.familyMember.deleteMany({});
  await prisma.schemeEnrollment.deleteMany({});
  await prisma.scheme.deleteMany({});
  await prisma.beneficiary.deleteMany({});

  await prisma.programEvent.deleteMany({});
  await prisma.schoolProgram.deleteMany({});
  await prisma.program.deleteMany({});

  await prisma.FLNResponse.deleteMany({});
  await prisma.SELResponse.deleteMany({});
  await prisma.SubjectAssessmentResponse.deleteMany({});
  await prisma.EnrollmentResponse.deleteMany({});
  await prisma.AssessmentForm.deleteMany({});
  await prisma.FLNQuestion.deleteMany({});
  await prisma.FLNCategory.deleteMany({});
  await prisma.SELQuestion.deleteMany({});
  await prisma.SubjectAssessmentTemplate.deleteMany({});

  await prisma.studentAttendanceLog.deleteMany({});
  await prisma.student.deleteMany({});

  await prisma.fellowReview.deleteMany({});
  await prisma.fellowSchool.deleteMany({});
  await prisma.fellow.deleteMany({});
  await prisma.school.deleteMany({});

  // Clean up user accounts for fellows to recreate them cleanly
  await prisma.user.deleteMany({
    where: {
      username: {
        in: ["aisha_rahman", "fatima_tariq", "bilal_khan", "joynal_abedin", "rupjan_nessa"]
      }
    }
  });

  // --- 1. ROLES & PERMISSIONS ---
  console.log("Seeding roles and permissions...");
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Super Administrator with complete platform control",
      displayInRegister: false,
    },
  });

  const pmRole = await prisma.role.upsert({
    where: { name: "PROGRAM_MANAGER" },
    update: {},
    create: {
      name: "PROGRAM_MANAGER",
      description: "Program Manager supervising Education, Livelihood, or Disaster Relief hubs",
      displayInRegister: true,
    },
  });

  const fellowRole = await prisma.role.upsert({
    where: { name: "FELLOW" },
    update: {},
    create: {
      name: "FELLOW",
      description: "Educational Fellow assigned to partner schools and students",
      displayInRegister: true,
    },
  });

  const pages = ["dashboard", "education", "livelihood", "disaster-relief", "hr", "admin"];
  const actions = ["READ", "WRITE"];
  const createdPermissions = [];

  for (const page of pages) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: {
          app_page_action: {
            app: "dashboard",
            page,
            action,
          },
        },
        update: {},
        create: {
          app: "dashboard",
          page,
          action,
        },
      });
      createdPermissions.push(perm);
    }
  }

  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign permissions to FELLOW role
  for (const perm of createdPermissions) {
    if (perm.action === "READ" || perm.page === "education" || perm.page === "dashboard") {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: fellowRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: fellowRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // --- 2. USER ACCOUNTS & CREDENTIALS ---
  console.log("Seeding user accounts...");
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const defaultAdmin = await prisma.user.upsert({
    where: { email: "admin@amanfoundation.org" },
    update: {},
    create: {
      name: "Super Administrator",
      username: "admin",
      email: "admin@amanfoundation.org",
      password: hashedPassword,
      status: "ACTIVE",
      roleId: adminRole.id,
      mobile: "+1234567890",
    },
  });
  console.log("Admin account seeded:", defaultAdmin.email);

  const pmHashedPassword = await bcrypt.hash("Manager@123", 10);
  const defaultPM = await prisma.user.upsert({
    where: { email: "pm@amanfoundation.org" },
    update: {},
    create: {
      name: "Program Manager",
      username: "pm_manager",
      email: "pm@amanfoundation.org",
      password: pmHashedPassword,
      status: "ACTIVE",
      roleId: pmRole.id,
      mobile: "+1234567891",
    },
  });

  const hashAisha = await bcrypt.hash("Aisha@123", 10);
  const userAisha = await prisma.user.create({
    data: {
      name: "Aisha Rahman",
      username: "aisha_rahman",
      email: "aisha.r@aman.org",
      password: hashAisha,
      status: "ACTIVE",
      roleId: fellowRole.id,
      mobile: "+91 98765 43211",
    },
  });

  const hashFatima = await bcrypt.hash("Fatima@123", 10);
  const userFatima = await prisma.user.create({
    data: {
      name: "Fatima Tariq",
      username: "fatima_tariq",
      email: "fatima.t@aman.org",
      password: hashFatima,
      status: "ACTIVE",
      roleId: fellowRole.id,
      mobile: "+91 98765 43212",
    },
  });

  const hashBilal = await bcrypt.hash("Bilal@123", 10);
  const userBilal = await prisma.user.create({
    data: {
      name: "Bilal Khan",
      username: "bilal_khan",
      email: "bilal.k@aman.org",
      password: hashBilal,
      status: "ACTIVE",
      roleId: fellowRole.id,
      mobile: "+91 98765 43213",
    },
  });

  const hashJoynal = await bcrypt.hash("Joynal@123", 10);
  const userJoynal = await prisma.user.create({
    data: {
      name: "Joynal Abedin",
      username: "joynal_abedin",
      email: "joynal.a@aman.org",
      password: hashJoynal,
      status: "ACTIVE",
      roleId: fellowRole.id,
      mobile: "+91 98765 43214",
    },
  });

  const hashRupjan = await bcrypt.hash("Rupjan@123", 10);
  const userRupjan = await prisma.user.create({
    data: {
      name: "Rupjan Nessa",
      username: "rupjan_nessa",
      email: "rupjan.n@aman.org",
      password: hashRupjan,
      status: "ACTIVE",
      roleId: fellowRole.id,
      mobile: "+91 98765 43215",
    },
  });

  // --- 3. EDUCATION MODULE ---
  console.log("Seeding Education Module...");

  // 3.1 Schools
  const school1 = await prisma.school.create({
    data: {
      name: "Raiyan Academy Bartary",
      location: "Bartari, Barpeta",
      address: "Bartari, Kalgachia Moinbari Road, Tapeswara, Barpeta-781319, Assam",
      status: "Active",
      goal: 85,
      latitude: "26.3592° N",
      longitude: "90.7186° E",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d114399.70456809347!2d90.71863679726563!3d26.359160600000017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3759a1c371a6b2ff%3A0xe4eb16136941af5f!2sraiyan%20academy%20bartary!5e0!3m2!1sen!2sin!4v1780501350920!5m2!1sen!2sin",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAd0x1ztc9iuj8nay2xC1_MH-xTSmAKr8IhFrASNZRkSKkt-Y4BunC5I9iqvTLQ0_8lmU0zaYnPjqddtwFcC75fjZRBUU-N_7DG60EY9HluYt_nZMGUi1MCuGMs9ZtR2iM2AGFyw2MvZhg-RlW1as3xPOOXef7qU9OwfisCQeoCv_6chJeBZbBMdmknEG_LLtMl_EWluwSEWTOAEkWm2p31lCjaolK7bQHfqtZzT6CLsbLoare9Nu918oPHFj07H0LgIShvW4giB6YL",
      principalName: "Principal Margaret",
      email: "bartary.academy@aman.org",
      phone: "+91 99887 76655"
    }
  });

  const school2 = await prisma.school.create({
    data: {
      name: "Digjani Lp School",
      location: "Kalgachia, Barpeta",
      address: "Kalgachia, Barpeta-781319, Assam",
      status: "Review",
      goal: 68,
      latitude: "26.3592° N",
      longitude: "90.8685° E",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.9907684646087!2d90.8684971754205!3d26.359160576981395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3759a38a647570d1%3A0x3e65ee3bc822352e!2sDigjani%20LP%20School!5e0!3m2!1sen!2sin!4v1780501385332!5m2!1sen!2sin",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz5AwPFuwFIR2gamqHGmS3Z3IdTDQwW83VVeH6b9NJQeyhwstun166F-NBJdmvRxVedIL-KvP2kSfrxII7pBp79OmeBVj_J6PnuiUawZodfc0uJXAvWrakkcwnw4Hqf3XMp1L_FWf3gbWbnqajq_B2L9R61bXpsmng6PGHQ1DhYHPRtNj0FIVW9oXuywykoMFb8kYgru_HD_DkySGwo1b-jcWzvibQ5MZ6R3bzcPgSiBKeu0Rk1ETZRc61Hdu6z3xj1KNhL2dgFdP5",
      principalName: "Principal Jenkins",
      email: "digjani.school@aman.org",
      phone: "+91 99887 76656"
    }
  });

  const school3 = await prisma.school.create({
    data: {
      name: "Collegiate High School",
      location: "Kokila Dakhin Para, Barpeta",
      address: "Kokila Dakhin Para, College Road, Kalgachia, Barpeta-781319, Assam",
      status: "Active",
      goal: 92,
      latitude: "26.3567° N",
      longitude: "90.8618° E",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3575.0677537798597!2d90.8618483754204!3d26.356670476983027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3759a1f71f84cb57%3A0x863755db40ba11af!2sCollegiate%20high%20school%2C%20kalgachia!5e0!3m2!1sen!2sin!4v1780501405835!5m2!1sen!2sin",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3JsQ8gLDGjXcAskdAgUZD_gbTWPDpCHJ32DnFoopdp-_p5I_tgEYtvw4dOCafH7MyasL1dS3wak_92AIaWlwMwG3sj4MjB1WuLlaXIrD_Pgmeuj-7QDOpOBBGV61QzLmn-ToK-R2LhxD-uDv5RiRqzcVeF6dzd8NDuP0UxUs4_6vkZrksOHYi1xW4AxQWl2kD1120kSJ72va_hR5sAs4V-2ir50bTZl6Oc9Rb9HATjyWanXkUOJDd6GDhhJaAsICMPa-8RFXRUFJx",
      principalName: "Principal Margaret",
      email: "collegiate.admin@school.edu",
      phone: "+91 99887 76657"
    }
  });

  const school4 = await prisma.school.create({
    data: {
      name: "Balikuri Lp School",
      location: "Balikuri, Barpeta",
      address: "Balikuri, Kalgachia Road, Barpeta-781319, Assam",
      status: "Active",
      goal: 75,
      latitude: "26.3621° N",
      longitude: "90.8710° E",
      principalName: "Principal Bora",
      email: "balikuri.school@aman.org",
      phone: "+91 99887 76658"
    }
  });

  const school5 = await prisma.school.create({
    data: {
      name: "Gunialguri High School",
      location: "Gunialguri, Barpeta",
      address: "Gunialguri, Kalgachia, Barpeta-781319, Assam",
      status: "Active",
      goal: 80,
      latitude: "26.3712° N",
      longitude: "90.8812° E",
      principalName: "Principal Ahmed",
      email: "gunialguri.school@aman.org",
      phone: "+91 99887 76659"
    }
  });

  // 3.2 Fellows
  const fellow1 = await prisma.fellow.create({
    data: {
      name: "Aisha Rahman",
      dob: new Date("1998-05-12"),
      gender: "Female",
      email: "aisha.r@aman.org",
      phone: "+91 98765 43211",
      address: "Bartari, Kalgachia, Assam",
      cohort: "Cohort '23",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7gMo5puf1sV4uTm3qk1tT-zVJzNDhR17iH7pqq5iCccFjIOCE8W3EHYIp9rK3D066Q9ZkVjeLVtNwSBF9m1-hvbOUGfnjJRGIchuJ3Eh6rp7nQKBpqZJzMPBwV1Qz0kmOpVSOMreor-iUVKwSv67qJNrwuROO0mgJdvBeUHMDI7zmdq1qTUV0QVFCkkSQdtuaqu2lruZIChfw5S3KIqkr12xKbUERZvogsBdHSPGMGD5RG1KZ_J33Im7k3p4NaNTFC6WFYrzLKONE",
      progress: 85,
      evaluationRating: 4.8,
      userId: userAisha.id
    }
  });

  const fellow2 = await prisma.fellow.create({
    data: {
      name: "Fatima Tariq",
      dob: new Date("1999-09-20"),
      gender: "Female",
      email: "fatima.t@aman.org",
      phone: "+91 98765 43212",
      address: "Digjani, Kalgachia, Assam",
      cohort: "Cohort '24",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyU2sk7MSF4O2N4v8tJyIJNfFFC-6k-MyJtM5UWnT68i4JIYVkOBu1pyvnRVdCmTIJDnx-PfGfOEnCJQ0R8CExOGEexqyfB1z4fmKGD0ZZpppomizo-LBDvgJ8cSyY7UCjxoCUf783rsdV_XGiKoyguceMlyb-QzZCf9Gl9MgF3zpl4Q4Y7qPKZ5wjhJdmNIwaFQ7oS2PR9wLYxjBEnkfftf-mWeb4t8u9qmDaop-LQNHejgvZkDUN_y3R2yStAL7Yvw-mXwMoaQdf",
      progress: 42,
      evaluationRating: 4.2,
      userId: userFatima.id
    }
  });

  const fellow3 = await prisma.fellow.create({
    data: {
      name: "Bilal Khan",
      dob: new Date("1997-11-05"),
      gender: "Male",
      email: "bilal.k@aman.org",
      phone: "+91 98765 43213",
      address: "Sawpur, Kalgachia, Assam",
      cohort: "Cohort '23",
      avatar: "",
      progress: 95,
      evaluationRating: 4.9,
      userId: userBilal.id
    }
  });

  const fellow4 = await prisma.fellow.create({
    data: {
      name: "Joynal Abedin",
      dob: new Date("1996-02-14"),
      gender: "Male",
      email: "joynal.a@aman.org",
      phone: "+91 98765 43214",
      address: "Bartari, Kalgachia, Assam",
      cohort: "Cohort '23",
      avatar: "",
      progress: 70,
      evaluationRating: 4.5,
      userId: userJoynal.id
    }
  });

  const fellow5 = await prisma.fellow.create({
    data: {
      name: "Rupjan Nessa",
      dob: new Date("2000-07-30"),
      gender: "Female",
      email: "rupjan.n@aman.org",
      phone: "+91 98765 43215",
      address: "Gunialguri, Kalgachia, Assam",
      cohort: "Cohort '24",
      avatar: "",
      progress: 55,
      evaluationRating: 4.0,
      userId: userRupjan.id
    }
  });

  // Link Fellows to Schools (M2M)
  await prisma.fellowSchool.createMany({
    data: [
      { fellowId: fellow1.id, schoolId: school1.id },
      { fellowId: fellow2.id, schoolId: school2.id },
      { fellowId: fellow3.id, schoolId: school3.id },
      { fellowId: fellow4.id, schoolId: school4.id },
      { fellowId: fellow5.id, schoolId: school5.id }
    ]
  });

  // 3.4 Fellow Reviews
  await prisma.fellowReview.create({
    data: {
      fellowId: fellow1.id,
      period: "Mid-Cohort Review (Period: Jan - Jun)",
      evaluation: "Aisha has demonstrated exceptional lesson planning capabilities. Her implementation of the interactive phonics cards resulted in standard 3 reading scores increasing by 34% in 4 months. She maintains robust communications logs with the school headmasters and has successfully normalized PTA assemblies.",
      rating: 4.8,
      reviewerName: "Sarah Jenkins (Operations Lead)"
    }
  });

  // 3.5 Students
  console.log("Seeding Students...");
  const studentsList = [
    { studentId: "STU-2023-089", name: "Aarav Kumar", dob: new Date("2013-04-14"), gender: "Male", email: "aarav@gmail.com", phone: "+91 98765 43210", address: "Ward 4, Bartari, Kalgachia", grade: "Grade 8", gradeGroup: "Middle (6-8)", district: "Bartari", attendance: 92.5, guardianName: "Rajesh Kumar", guardianPhone: "+91 98765 43210", enrolmentDate: new Date("2023-06-15"), primaryLanguage: "Hindi, English", status: "On Track", schoolId: school1.id, fellowId: fellow1.id },
    { studentId: "STU-2023-142", name: "Priya Singh", dob: new Date("2016-08-25"), gender: "Female", email: "priya@gmail.com", phone: "+91 98765 43232", address: "Kalgachia Circle", grade: "Grade 5", gradeGroup: "Primary (1-5)", district: "Kalgachia", attendance: 68.0, guardianName: "Manish Singh", guardianPhone: "+91 98765 43233", enrolmentDate: new Date("2023-08-01"), primaryLanguage: "Bengali, Hindi", status: "Needs Attention", schoolId: school2.id, fellowId: fellow2.id },
    { studentId: "STU-2022-401", name: "Rahul Desai", dob: new Date("2011-12-05"), gender: "Male", email: "rahul@gmail.com", phone: "+91 98765 43254", address: "Kokila Dakhin Para", grade: "Grade 10", gradeGroup: "High (9-10)", district: "Kokila Dakhin Para", attendance: 98.2, guardianName: "Amit Desai", guardianPhone: "+91 98765 43255", enrolmentDate: new Date("2022-04-15"), primaryLanguage: "Assamese, English", status: "On Track", schoolId: school3.id, fellowId: fellow3.id },
    { studentId: "STU-2024-012", name: "Meera Patel", dob: new Date("2015-02-18"), gender: "Female", email: "meera@gmail.com", phone: "+91 98765 43260", address: "Ward 4, Bartari, Kalgachia", grade: "Grade 6", gradeGroup: "Middle (6-8)", district: "Bartari", attendance: 85.0, guardianName: "Arvind Patel", guardianPhone: "+91 98765 43261", enrolmentDate: new Date("2024-06-01"), primaryLanguage: "Assamese, Bengali", status: "On Track", schoolId: school1.id, fellowId: fellow1.id },
    { studentId: "STU-2023-205", name: "Joydeb Das", dob: new Date("2014-06-20"), gender: "Male", email: "joydeb@gmail.com", phone: "+91 98765 43277", address: "Balikuri village", grade: "Grade 7", gradeGroup: "Middle (6-8)", district: "Balikuri", attendance: 78.4, guardianName: "Gopal Das", guardianPhone: "+91 98765 43278", enrolmentDate: new Date("2023-06-20"), primaryLanguage: "Assamese", status: "On Track", schoolId: school4.id, fellowId: fellow4.id },
    { studentId: "STU-2023-311", name: "Sumitra Boro", dob: new Date("2012-11-10"), gender: "Female", email: "sumitra@gmail.com", phone: "+91 98765 43288", address: "Sawpur village", grade: "Grade 9", gradeGroup: "High (9-10)", district: "Sawpur", attendance: 89.0, guardianName: "Lalit Boro", guardianPhone: "+91 98765 43289", enrolmentDate: new Date("2023-06-22"), primaryLanguage: "Bodo, Assamese", status: "On Track", schoolId: school3.id, fellowId: fellow3.id },
    { studentId: "STU-2024-045", name: "Imran Hussain", dob: new Date("2017-01-05"), gender: "Male", email: "imran@gmail.com", phone: "+91 98765 43290", address: "Gunialguri Ward 2", grade: "Grade 3", gradeGroup: "Primary (1-5)", district: "Gunialguri", attendance: 91.2, guardianName: "Raju Hussain", guardianPhone: "+91 98765 43291", enrolmentDate: new Date("2024-01-10"), primaryLanguage: "Bengali", status: "On Track", schoolId: school5.id, fellowId: fellow5.id },
    { studentId: "STU-2024-098", name: "Rehana Begum", dob: new Date("2016-09-12"), gender: "Female", email: "rehana@gmail.com", phone: "+91 98765 43295", address: "Bartari Village", grade: "Grade 4", gradeGroup: "Primary (1-5)", district: "Bartari", attendance: 65.5, guardianName: "Ali Begum", guardianPhone: "+91 98765 43296", enrolmentDate: new Date("2024-02-15"), primaryLanguage: "Bengali", status: "Needs Attention", schoolId: school1.id, fellowId: fellow4.id },
    { studentId: "STU-2023-118", name: "Parbin Sultana", dob: new Date("2015-05-24"), gender: "Female", email: "parbin@gmail.com", phone: "+91 98765 43301", address: "Gunialguri", grade: "Grade 5", gradeGroup: "Primary (1-5)", district: "Gunialguri", attendance: 83.2, guardianName: "Sahanur Ali", guardianPhone: "+91 98765 43302", enrolmentDate: new Date("2023-07-01"), primaryLanguage: "Assamese, Bengali", status: "On Track", schoolId: school5.id, fellowId: fellow5.id },
    { studentId: "STU-2022-077", name: "Monowar Ali", dob: new Date("2010-08-14"), gender: "Male", email: "monowar@gmail.com", phone: "+91 98765 43311", address: "Balikuri Ward 1", grade: "Grade 10", gradeGroup: "High (9-10)", district: "Balikuri", attendance: 95.0, guardianName: "Hafizur Ali", guardianPhone: "+91 98765 43312", enrolmentDate: new Date("2022-05-01"), primaryLanguage: "Assamese", status: "On Track", schoolId: school4.id, fellowId: fellow4.id }
  ];

  const createdStudents = [];
  for (const s of studentsList) {
    const student = await prisma.student.create({ data: s });
    createdStudents.push(student);
  }

  // 3.6 Attendance Logs (Seeded dynamically)
  console.log("Seeding attendance logs...");
  const months = ["Jan", "Feb", "Mar", "Apr", "May"];

  for (const student of createdStudents) {
    for (const mon of months) {
      const total = 22;
      const present = Math.floor(14 + Math.random() * 9); // 14 to 22
      const percentage = parseFloat(((present / total) * 100).toFixed(1));

      await prisma.studentAttendanceLog.create({
        data: {
          studentId: student.id,
          month: mon,
          present,
          total,
          percentage
        }
      });
    }
  }

  // 3.7 Programs & PTA
  const prog1 = await prisma.program.create({
    data: {
      title: "Annual Literacy Drive",
      description: "Comprehensive reading initiative targeting Standard 3 & 4 students.",
      duration: "6 Months",
      participantsText: "450 Students Enrolled",
      status: "Active",
      icon: "campaign",
      iconBg: "bg-primary/10 text-primary"
    }
  });

  const prog2 = await prisma.program.create({
    data: {
      title: "Digital Literacy Course",
      description: "Basic computing classes for middle and high school students in partner schools.",
      duration: "3 Months",
      participantsText: "Planning (120 Expected)",
      status: "Planning",
      icon: "computer",
      iconBg: "bg-secondary-fixed text-on-secondary-container"
    }
  });

  const prog3 = await prisma.program.create({
    data: {
      title: "Primary School Numeracy Bootcamp",
      description: "Fast-track arithmetic drills to enhance core numeracy skills in primary classes.",
      duration: "2 Months",
      participantsText: "280 Students (Completed)",
      status: "Completed",
      icon: "calculate",
      iconBg: "bg-tertiary/10 text-tertiary"
    }
  });

  // Connect program to school
  await prisma.schoolProgram.createMany({
    data: [
      { schoolId: school1.id, programId: prog1.id },
      { schoolId: school2.id, programId: prog1.id },
      { schoolId: school3.id, programId: prog2.id },
      { schoolId: school4.id, programId: prog3.id },
      { schoolId: school5.id, programId: prog1.id }
    ]
  });

  // PTA Events
  await prisma.programEvent.createMany({
    data: [
      { programId: prog1.id, title: "Q3 PTA General Assembly", description: "Review of student outcomes, infrastructure needs, and parent feedback.", date: new Date("2026-10-24T10:00:00"), location: "Oakridge Main Hall", status: "Completed" },
      { programId: prog1.id, title: "Fellow-Parent Welcome Committee", description: "Orientation session welcoming Cohort '24 fellows to the district.", date: new Date("2026-11-12T11:30:00"), location: "Riverside Classroom B", status: "Scheduled" },
      { programId: prog3.id, title: "Numeracy Exhibition & Award Day", description: "Certificates distribution to top bootcamp math solvers.", date: new Date("2026-05-15T09:00:00"), location: "Balikuri School Ground", status: "Completed" }
    ]
  });

  // --- 4. LIVELIHOOD MODULE ---
  console.log("Seeding Livelihood Module...");

  const schemeGoat = await prisma.scheme.upsert({
    where: { name: "Goat Rearing" },
    update: {},
    create: {
      name: "Goat Rearing",
      description: "Providing high-yield breed goats and vaccination mapping to poor rural families."
    }
  });

  const schemeCane = await prisma.scheme.upsert({
    where: { name: "Sugarcane" },
    update: {},
    create: {
      name: "Sugarcane",
      description: "Sugarcane seed distribution, mini-sprinklers, and yield optimization advice."
    }
  });

  // Programs under Goat Rearing
  const goatProgram1 = await prisma.goatRearingProgram.create({
    data: { name: "Black Bengal Multiplication Phase I", description: "Focuses on breeding high-yield Black Bengal goats in Bartari village." }
  });
  const goatProgram2 = await prisma.goatRearingProgram.create({
    data: { name: "High-Yield Fodder Training Program", description: "Training beneficiaries on sustainable silage preparation and veterinary basics." }
  });
  const goatProgram3 = await prisma.goatRearingProgram.create({
    data: { name: "Silage & Feed Development Scheme", description: "Providing machinery for local community fodder blocks." }
  });

  // Programs under Sugarcane
  const caneProgram1 = await prisma.sugarcaneProgram.create({
    data: { name: "Kalgachia Cane Development 2026", description: "High-performance sugarcane seed distribution and drip irrigation support.", totalLandHectares: 25.5 }
  });
  const caneProgram2 = await prisma.sugarcaneProgram.create({
    data: { name: "Beki Basin Cane Program", description: "Soil salinity correction and organic composting support in river basin soils.", totalLandHectares: 18.0 }
  });
  const caneProgram3 = await prisma.sugarcaneProgram.create({
    data: { name: "Organic Composting & Fertilizer Scheme", description: "Promoting chemical-free compost block application in sandy loam soils.", totalLandHectares: 15.0 }
  });

  // --- NEW: Unified Livelihood Programs ---
  console.log("Seeding Unified Livelihood Programs...");

  const unifiedGoat1 = await prisma.livelihoodProgram.create({
    data: { category: "NON_FARM", type: "goat_rearing", name: "Black Bengal Multiplication Phase I", description: "Focuses on breeding high-yield Black Bengal goats in Bartari village.", totalTarget: 50 }
  });
  const unifiedGoat2 = await prisma.livelihoodProgram.create({
    data: { category: "NON_FARM", type: "goat_rearing", name: "High-Yield Fodder Training Program", description: "Training beneficiaries on sustainable silage preparation and veterinary basics.", totalTarget: 30 }
  });
  const unifiedGoat3 = await prisma.livelihoodProgram.create({
    data: { category: "NON_FARM", type: "goat_rearing", name: "Silage & Feed Development Scheme", description: "Providing machinery for local community fodder blocks.", totalTarget: 20 }
  });
  const unifiedCane1 = await prisma.livelihoodProgram.create({
    data: { category: "FARM", type: "sugarcane_cultivation", name: "Kalgachia Cane Development 2026", description: "High-performance sugarcane seed distribution and drip irrigation support.", totalTarget: 25.5 }
  });
  const unifiedCane2 = await prisma.livelihoodProgram.create({
    data: { category: "FARM", type: "sugarcane_cultivation", name: "Beki Basin Cane Program", description: "Soil salinity correction and organic composting support in river basin soils.", totalTarget: 18.0 }
  });
  const unifiedCane3 = await prisma.livelihoodProgram.create({
    data: { category: "FARM", type: "sugarcane_cultivation", name: "Organic Composting & Fertilizer Scheme", description: "Promoting chemical-free compost block application in sandy loam soils.", totalTarget: 15.0 }
  });

  // Additional example programs
  const maizeProg = await prisma.livelihoodProgram.create({
    data: { category: "FARM", type: "maize_cultivation", name: "Rainfed Maize Initiative 2026", description: "Promoting high-yield maize varieties with organic farming practices.", totalTarget: 12.0 }
  });
  const fishProg = await prisma.livelihoodProgram.create({
    data: { category: "NON_FARM", type: "fish_farming", name: "Community Fish Pond Development", description: "Developing community-level fish farming ponds for income diversification.", totalTarget: 500 }
  });

  // Beneficiaries list (10 realistic records)
  const beneficiariesList = [
    { enrolmentId: "BEN-482-A", name: "Amina Patel", dob: new Date("1984-03-15"), panCard: "BCDPN1234X", aadhar: "1234 5678 9012", rationCard: "SFY-AS-4029", mobNumber: "+91 99887 71122", resilienceScore: 82, annualIncome: 45000, monthlyIncome: 3750, caste: "General", religion: "Islam", address: "Bartari, Kalgachia, Assam", householdSize: 5, primaryIncomeType: "Agriculture", tier: "Tier 2", tierPercent: 65, bankName: "State Bank of India", bankAccountNo: "30928409184", bankIfsc: "SBIN0007421" },
    { enrolmentId: "BEN-104-B", name: "Rajesh Gond", dob: new Date("1979-07-22"), panCard: "GNDPR9876C", aadhar: "9876 5432 1098", rationCard: "SFY-AS-5012", mobNumber: "+91 99887 71125", resilienceScore: 58, annualIncome: 32000, monthlyIncome: 2660, caste: "ST", religion: "Hinduism", address: "Digjani, Kalgachia, Assam", householdSize: 4, primaryIncomeType: "Livestock", tier: "Tier 1", tierPercent: 40, bankName: "Assam Gramin Vikash Bank", bankAccountNo: "501928401928", bankIfsc: "UTBI0RRBAGB" },
    { enrolmentId: "BEN-511-N", name: "Rupjan Nessa", dob: new Date("1988-10-10"), panCard: "NSSPR2012F", aadhar: "2012 3456 7890", rationCard: "SFY-AS-3019", mobNumber: "+91 99887 71130", resilienceScore: 74, annualIncome: 38000, monthlyIncome: 3160, caste: "OBC", religion: "Islam", address: "Gunialguri, Kalgachia, Assam", householdSize: 5, primaryIncomeType: "Livestock", tier: "Tier 2", tierPercent: 65, bankName: "Punjab National Bank", bankAccountNo: "09182309184", bankIfsc: "PUNB0029300" },
    { enrolmentId: "BEN-839-K", name: "Abul Kalam", dob: new Date("1972-04-12"), panCard: "KLMPR4029G", aadhar: "4029 8765 4321", rationCard: "SFY-AS-9812", mobNumber: "+91 99887 71135", resilienceScore: 88, annualIncome: 55000, monthlyIncome: 4580, caste: "General", religion: "Islam", address: "Bartari, Kalgachia, Assam", householdSize: 6, primaryIncomeType: "Agriculture", tier: "Tier 3", tierPercent: 90, bankName: "State Bank of India", bankAccountNo: "30928409199", bankIfsc: "SBIN0007421" },
    { enrolmentId: "BEN-293-X", name: "Khadija Khatun", dob: new Date("1991-11-25"), panCard: "KHTPR0912H", aadhar: "0912 9283 4810", rationCard: "SFY-AS-0921", mobNumber: "+91 99887 71140", resilienceScore: 48, annualIncome: 24000, monthlyIncome: 2000, caste: "General", religion: "Islam", address: "Moinbari, Kalgachia, Assam", householdSize: 7, primaryIncomeType: "Livestock", tier: "Tier 1", tierPercent: 40, bankName: "Assam Gramin Vikash Bank", bankAccountNo: "501928401955", bankIfsc: "UTBI0RRBAGB" },
    { enrolmentId: "BEN-702-J", name: "Joynal Abedin", dob: new Date("1980-01-01"), panCard: "ABDPR7021K", aadhar: "7021 3928 4812", rationCard: "SFY-AS-7711", mobNumber: "+91 99887 71145", resilienceScore: 65, annualIncome: 41000, monthlyIncome: 3410, caste: "General", religion: "Islam", address: "Bartari, Kalgachia, Assam", householdSize: 4, primaryIncomeType: "Agriculture", tier: "Tier 2", tierPercent: 65, bankName: "Indian Bank", bankAccountNo: "70928340912", bankIfsc: "IDIB000K105" },
    { enrolmentId: "BEN-155-S", name: "Sumitra Rabha", dob: new Date("1985-05-18"), panCard: "RBHPR1550L", aadhar: "1550 4918 2930", rationCard: "SFY-AS-1551", mobNumber: "+91 99887 71150", resilienceScore: 71, annualIncome: 39000, monthlyIncome: 3250, caste: "ST", religion: "Hinduism", address: "Sawpur, Kalgachia, Assam", householdSize: 4, primaryIncomeType: "Agriculture", tier: "Tier 2", tierPercent: 65, bankName: "State Bank of India", bankAccountNo: "30928409212", bankIfsc: "SBIN0007421" },
    { enrolmentId: "BEN-304-D", name: "Dipankar Das", dob: new Date("1983-09-09"), panCard: "DASPR3041M", aadhar: "3041 2938 4820", rationCard: "SFY-AS-3042", mobNumber: "+91 99887 71155", resilienceScore: 52, annualIncome: 29000, monthlyIncome: 2410, caste: "SC", religion: "Hinduism", address: "Balikuri, Kalgachia, Assam", householdSize: 5, primaryIncomeType: "Livestock", tier: "Tier 1", tierPercent: 40, bankName: "United Bank of India", bankAccountNo: "10928409184", bankIfsc: "UTBI0KGC812" },
    { enrolmentId: "BEN-912-M", name: "Mainul Hoque", dob: new Date("1976-12-14"), panCard: "HQUPR9122N", aadhar: "9122 3928 4810", rationCard: "SFY-AS-9123", mobNumber: "+91 99887 71160", resilienceScore: 80, annualIncome: 48000, monthlyIncome: 4000, caste: "General", religion: "Islam", address: "Sawpur, Kalgachia, Assam", householdSize: 6, primaryIncomeType: "Agriculture", tier: "Tier 2", tierPercent: 65, bankName: "State Bank of India", bankAccountNo: "30928409333", bankIfsc: "SBIN0007421" },
    { enrolmentId: "BEN-620-Y", name: "Sabina Yesmin", dob: new Date("1989-08-08"), panCard: "YSMPR6201P", aadhar: "6201 3928 4092", rationCard: "SFY-AS-6202", mobNumber: "+91 99887 71165", resilienceScore: 60, annualIncome: 35000, monthlyIncome: 2910, caste: "General", religion: "Islam", address: "Digjani, Kalgachia, Assam", householdSize: 4, primaryIncomeType: "Livestock", tier: "Tier 2", tierPercent: 65, bankName: "Canara Bank", bankAccountNo: "40928340918", bankIfsc: "CNRB0002910" }
  ];

  const createdBeneficiaries = [];
  for (const b of beneficiariesList) {
    const ben = await prisma.beneficiary.create({ data: b });
    createdBeneficiaries.push(ben);
  }

  // Scheme Enrollments
  await prisma.schemeEnrollment.createMany({
    data: [
      { beneficiaryId: createdBeneficiaries[0].id, schemeId: schemeGoat.id }, // Amina
      { beneficiaryId: createdBeneficiaries[0].id, schemeId: schemeCane.id },
      { beneficiaryId: createdBeneficiaries[1].id, schemeId: schemeGoat.id }, // Rajesh
      { beneficiaryId: createdBeneficiaries[2].id, schemeId: schemeGoat.id }, // Rupjan
      { beneficiaryId: createdBeneficiaries[3].id, schemeId: schemeCane.id }, // Abul
      { beneficiaryId: createdBeneficiaries[4].id, schemeId: schemeGoat.id }, // Khadija
      { beneficiaryId: createdBeneficiaries[5].id, schemeId: schemeGoat.id }, // Joynal
      { beneficiaryId: createdBeneficiaries[5].id, schemeId: schemeCane.id },
      { beneficiaryId: createdBeneficiaries[6].id, schemeId: schemeCane.id }, // Sumitra
      { beneficiaryId: createdBeneficiaries[7].id, schemeId: schemeGoat.id }, // Dipankar
      { beneficiaryId: createdBeneficiaries[8].id, schemeId: schemeCane.id }, // Mainul
      { beneficiaryId: createdBeneficiaries[9].id, schemeId: schemeGoat.id }  // Sabina
    ]
  });

  // Family Members
  await prisma.familyMember.createMany({
    data: [
      // Amina family
      { beneficiaryId: createdBeneficiaries[0].id, name: "Ali Patel", relation: "Spouse", dob: new Date("1981-08-10"), contactInfo: "+91 99887 71123" },
      { beneficiaryId: createdBeneficiaries[0].id, name: "Sana Patel", relation: "Daughter", dob: new Date("2008-04-03"), contactInfo: "+91 99887 71124" },
      // Rajesh family
      { beneficiaryId: createdBeneficiaries[1].id, name: "Gita Gond", relation: "Spouse", dob: new Date("1983-05-15"), contactInfo: "+91 99887 71126" },
      { beneficiaryId: createdBeneficiaries[1].id, name: "Amit Gond", relation: "Son", dob: new Date("2010-09-20"), contactInfo: "" },
      // Rupjan family
      { beneficiaryId: createdBeneficiaries[2].id, name: "Kaddus Ali", relation: "Spouse", dob: new Date("1982-02-12"), contactInfo: "+91 99887 71131" },
      // Abul family
      { beneficiaryId: createdBeneficiaries[3].id, name: "Johra Kalam", relation: "Spouse", dob: new Date("1977-03-24"), contactInfo: "" }
    ]
  });

  // Livestock assets allocation
  console.log("Seeding Livestock Assets...");
  const livestockData = [
    { beneficiaryId: createdBeneficiaries[0].id, tagNumber: "Tag #GR-4092", animalType: "Goat", breed: "Black Bengal", ageMonths: 18, healthStatus: "Healthy" },
    { beneficiaryId: createdBeneficiaries[0].id, tagNumber: "Tag #GR-3988", animalType: "Goat", breed: "Black Bengal", ageMonths: 24, healthStatus: "Healthy" },
    { beneficiaryId: createdBeneficiaries[1].id, tagNumber: "Tag #GR-4105", animalType: "Goat", breed: "Black Bengal", ageMonths: 12, healthStatus: "Needs Check" },
    { beneficiaryId: createdBeneficiaries[2].id, tagNumber: "Tag #GR-4200", animalType: "Goat", breed: "Beetal", ageMonths: 14, healthStatus: "Healthy" },
    { beneficiaryId: createdBeneficiaries[2].id, tagNumber: "Tag #GR-4201", animalType: "Goat", breed: "Beetal", ageMonths: 16, healthStatus: "Healthy" },
    { beneficiaryId: createdBeneficiaries[4].id, tagNumber: "Tag #GR-5011", animalType: "Goat", breed: "Black Bengal", ageMonths: 8, healthStatus: "Healthy" },
    { beneficiaryId: createdBeneficiaries[5].id, tagNumber: "Tag #GR-6029", animalType: "Goat", breed: "Sirohi", ageMonths: 20, healthStatus: "Healthy" },
    { beneficiaryId: createdBeneficiaries[7].id, tagNumber: "Tag #GR-7045", animalType: "Goat", breed: "Black Bengal", ageMonths: 22, healthStatus: "Needs Check" },
    { beneficiaryId: createdBeneficiaries[9].id, tagNumber: "Tag #GR-8012", animalType: "Goat", breed: "Black Bengal", ageMonths: 10, healthStatus: "Healthy" }
  ];

  const createdLivestock = [];
  for (const l of livestockData) {
    const liveObj = await prisma.livestock.create({ data: l });
    createdLivestock.push(liveObj);
  }

  // Health logs for livestock
  await prisma.livestockHealthLog.createMany({
    data: [
      { livestockId: createdLivestock[0].id, checkupDate: new Date("2026-06-01"), status: "Healthy", notes: "Regular deworming tablet given.", performedBy: "Dr. Ahmed" },
      { livestockId: createdLivestock[2].id, checkupDate: new Date("2026-06-15"), status: "Needs Check", notes: "Mild fever detected. Administered paracetamol.", performedBy: "Dr. Ahmed" },
      { livestockId: createdLivestock[7].id, checkupDate: new Date("2026-06-16"), status: "Needs Check", notes: "Hoof infection checkup. Prescribed antiseptic spray.", performedBy: "Dr. Ahmed" }
    ]
  });

  // Goat Rearing scheme details per beneficiary
  await prisma.beneficiaryGoatRearing.createMany({
    data: [
      { beneficiaryId: createdBeneficiaries[0].id, goatsAssigned: 3, investment: 12000, returnsAmount: 29400, roiPercentage: 145.0, advantagesLog: "Increased household savings, herd multiplier active.", goatRearingProgramId: goatProgram1.id },
      { beneficiaryId: createdBeneficiaries[1].id, goatsAssigned: 2, investment: 8000, returnsAmount: 16000, roiPercentage: 100.0, advantagesLog: "Supplementary household income, milk for local consumption.", goatRearingProgramId: goatProgram2.id },
      { beneficiaryId: createdBeneficiaries[2].id, goatsAssigned: 4, investment: 16000, returnsAmount: 32000, roiPercentage: 100.0, advantagesLog: "Herd expansion in progress, organic manure production.", goatRearingProgramId: goatProgram1.id },
      { beneficiaryId: createdBeneficiaries[4].id, goatsAssigned: 2, investment: 8000, returnsAmount: 12000, roiPercentage: 50.0, advantagesLog: "Initial kidding successful.", goatRearingProgramId: goatProgram2.id },
      { beneficiaryId: createdBeneficiaries[5].id, goatsAssigned: 3, investment: 12000, returnsAmount: 26000, roiPercentage: 116.6, advantagesLog: "Good sales in local Bakrid market.", goatRearingProgramId: goatProgram3.id },
      { beneficiaryId: createdBeneficiaries[7].id, goatsAssigned: 2, investment: 8000, returnsAmount: 10000, roiPercentage: 25.0, advantagesLog: "One animal currently under medical care.", goatRearingProgramId: goatProgram1.id },
      { beneficiaryId: createdBeneficiaries[9].id, goatsAssigned: 3, investment: 12000, returnsAmount: 24000, roiPercentage: 100.0, advantagesLog: "Additional protein source for children.", goatRearingProgramId: goatProgram2.id }
    ]
  });

  // Sugarcane scheme details per beneficiary
  await prisma.beneficiarySugarcane.createMany({
    data: [
      { beneficiaryId: createdBeneficiaries[0].id, hectaresAllotted: 4.5, soilType: "Clay Loam", waterSource: "Drip Irrigation", cropStage: "Growing", estimatedYieldTons: 202.5, actualYieldTons: 198.0, estimatedRevenue: 631800, actualRevenue: 617760, fertilizersDistributed: "NPK fertilizer packs (5 bags)", sugarcaneProgramId: caneProgram1.id },
      { beneficiaryId: createdBeneficiaries[3].id, hectaresAllotted: 5.2, soilType: "Sandy Loam", waterSource: "Canal Linkage", cropStage: "Growing", estimatedYieldTons: 234.0, estimatedRevenue: 730080, fertilizersDistributed: "NPK (4 bags), Urea (2 bags)", sugarcaneProgramId: caneProgram1.id },
      { beneficiaryId: createdBeneficiaries[5].id, hectaresAllotted: 3.5, soilType: "Clay Loam", waterSource: "Rainfed", cropStage: "Planting", estimatedYieldTons: 157.5, estimatedRevenue: 491400, fertilizersDistributed: "Organic compost block", sugarcaneProgramId: caneProgram2.id },
      { beneficiaryId: createdBeneficiaries[6].id, hectaresAllotted: 4.0, soilType: "Alluvial Soil", waterSource: "Drip Irrigation", cropStage: "Growing", estimatedYieldTons: 180.0, estimatedRevenue: 561600, fertilizersDistributed: "NPK fertilizer packs (4 bags)", sugarcaneProgramId: caneProgram3.id },
      { beneficiaryId: createdBeneficiaries[8].id, hectaresAllotted: 6.0, soilType: "Clay Loam", waterSource: "Canal Linkage", cropStage: "Harvesting", estimatedYieldTons: 270.0, actualYieldTons: 278.4, estimatedRevenue: 842400, actualRevenue: 868608, fertilizersDistributed: "NPK (6 bags), compost block", sugarcaneProgramId: caneProgram2.id }
    ]
  });

  // --- NEW: Unified BeneficiaryLivelihood Assignments ---
  console.log("Seeding Unified Livelihood Assignments...");

  // Goat rearing assignments (unified)
  await prisma.beneficiaryLivelihood.createMany({
    data: [
      { beneficiaryId: createdBeneficiaries[0].id, programId: unifiedGoat1.id, attributes: { goatsAssigned: 3, investment: 12000, returnsAmount: 29400, roiPercentage: 145.0, advantagesLog: "Increased household savings, herd multiplier active." } },
      { beneficiaryId: createdBeneficiaries[1].id, programId: unifiedGoat2.id, attributes: { goatsAssigned: 2, investment: 8000, returnsAmount: 16000, roiPercentage: 100.0, advantagesLog: "Supplementary household income, milk for local consumption." } },
      { beneficiaryId: createdBeneficiaries[2].id, programId: unifiedGoat1.id, attributes: { goatsAssigned: 4, investment: 16000, returnsAmount: 32000, roiPercentage: 100.0, advantagesLog: "Herd expansion in progress, organic manure production." } },
    ]
  });

  // Sugarcane assignments (unified)
  await prisma.beneficiaryLivelihood.createMany({
    data: [
      { beneficiaryId: createdBeneficiaries[0].id, programId: unifiedCane1.id, attributes: { hectaresAllotted: 4.5, soilType: "Clay Loam", waterSource: "Drip Irrigation", cropStage: "Growing", estimatedYieldTons: 202.5, actualYieldTons: 198.0, fertilizersDistributed: "NPK fertilizer packs (5 bags)", estimatedRevenue: 631800, actualRevenue: 617760 } },
      { beneficiaryId: createdBeneficiaries[3].id, programId: unifiedCane1.id, attributes: { hectaresAllotted: 5.2, soilType: "Sandy Loam", waterSource: "Canal Linkage", cropStage: "Growing", estimatedYieldTons: 234.0, estimatedRevenue: 730080, fertilizersDistributed: "NPK (4 bags), Urea (2 bags)" } },
      { beneficiaryId: createdBeneficiaries[5].id, programId: unifiedCane2.id, attributes: { hectaresAllotted: 3.5, soilType: "Clay Loam", waterSource: "Rainfed", cropStage: "Planting", estimatedYieldTons: 157.5, estimatedRevenue: 491400, fertilizersDistributed: "Organic compost block" } },
    ]
  });

  // Maize assignment example
  await prisma.beneficiaryLivelihood.create({
    data: { beneficiaryId: createdBeneficiaries[6].id, programId: maizeProg.id, attributes: { hectaresAllotted: 2.5, seedVariety: "HQPM-1 Hybrid", soilType: "Sandy Loam", waterSource: "Rainfed", cropStage: "Growing", estimatedYieldTons: 15.0, estimatedRevenue: 45000 } }
  });

  // Fish farming assignment example with event
  const fishAssign = await prisma.beneficiaryLivelihood.create({
    data: { beneficiaryId: createdBeneficiaries[8].id, programId: fishProg.id, attributes: { pondSize: 200, fishCount: 500, fishSpecies: "Rohu", feedType: "Commercial floating pellets", estimatedHarvestKg: 250, estimatedRevenue: 50000 } }
  });
  await prisma.livelihoodEvent.create({
    data: { livelihoodId: fishAssign.id, eventType: "Stocking", eventDate: new Date("2026-04-15"), quantity: 500, notes: "Initial fingerling stocking completed", recordedBy: "Field Officer" }
  });

  // Goat event examples (unified)
  const goatAssign1 = await prisma.beneficiaryLivelihood.findFirst({ where: { beneficiaryId: createdBeneficiaries[0].id, programId: unifiedGoat1.id } });
  if (goatAssign1) {
    await prisma.livelihoodEvent.createMany({
      data: [
        { livelihoodId: goatAssign1.id, eventType: "Pregnancy", eventDate: new Date("2026-03-10"), quantity: 2, notes: "Two does confirmed pregnant by veterinarian." },
        { livelihoodId: goatAssign1.id, eventType: "ChildBirth", eventDate: new Date("2026-06-05"), quantity: 3, notes: "Three healthy kids born. All nursing well." },
      ]
    });
  }

  // --- 5. DISASTER RELIEF MODULE ---
  console.log("Seeding Disaster Relief Module...");

  const incident = await prisma.disasterIncident.create({
    data: {
      name: "Beki River Flood June 2026",
      location: "Bartari & Digjani Circle, Kalgachia",
      type: "Flood",
      active: true
    }
  });

  const oldIncident1 = await prisma.disasterIncident.create({
    data: {
      name: "Kalgachia Storm Relief April 2026",
      location: "Sawpur Village",
      type: "Storm",
      active: false
    }
  });

  // Help Providers
  const provider1 = await prisma.helpProvider.create({
    data: { name: "Kalgachia Hospital Medical Unit", capabilityType: "Responders (Medical & Health)", contactDetails: "Dr. A. Rahman (+91 94350 99281)", status: "Active in Bartari Camp" }
  });
  const provider2 = await prisma.helpProvider.create({
    data: { name: "Aman Foundation Relief Convoy", capabilityType: "Responders (Logistics & Food)", contactDetails: "H. Ali (convoy_lead@amanassam.org)", status: "Dispatched to Moinbari Char" }
  });
  const provider3 = await prisma.helpProvider.create({
    data: { name: "Kalgachia Student Volunteer Cohort", capabilityType: "Volunteers (Distribution)", contactDetails: "College Volunteer Group (+91 94350 88290)", status: "Standby / Rest" }
  });
  const provider4 = await prisma.helpProvider.create({
    data: { name: "Red Cross Barpeta Chapter", capabilityType: "Responders (Tarpaulins & Medical)", contactDetails: "District Coordinator", status: "Active in relief camps" }
  });

  // Link responder to incident
  await prisma.helpProviderIncident.createMany({
    data: [
      { providerId: provider1.id, incidentId: incident.id },
      { providerId: provider2.id, incidentId: incident.id },
      { providerId: provider4.id, incidentId: incident.id }
    ]
  });

  // Affected Families
  const families = [
    { incidentId: incident.id, familyName: "Ahmed Family", location: "Bartari School Shelter, Kalgachia", familySize: 5, aidRequirements: "Dry Rations, Tarpaulins", priority: "High Priority" },
    { incidentId: incident.id, familyName: "Sawpur Char Evacuees", location: "Sawpur High School, Kalgachia", familySize: 8, aidRequirements: "Medical Aid, Mosquito Nets", priority: "Completed" },
    { incidentId: incident.id, familyName: "Boro Family", location: "Sawpur Relief Camp", familySize: 4, aidRequirements: "Baby Food, Clean Drinking Water", priority: "High Priority" },
    { incidentId: incident.id, familyName: "Dewan Family", location: "Bartari School Shelter", familySize: 6, aidRequirements: "Dry Rations, Blankets", priority: "Medium Priority" },
    { incidentId: incident.id, familyName: "Sultana Family", location: "Moinbari Shelter Camp", familySize: 3, aidRequirements: "Sanitation Kits, Clean Water", priority: "High Priority" },
    { incidentId: incident.id, familyName: "Rabha Evacuees", location: "Sawpur High School, Kalgachia", familySize: 5, aidRequirements: "Tarpaulins, Dry Rations", priority: "Medium Priority" }
  ];

  const createdFamilies = [];
  for (const f of families) {
    const aff = await prisma.affectedFamily.create({ data: f });
    createdFamilies.push(aff);
  }

  // Inventory Stocks
  const resItem1 = await prisma.resourceItem.create({ data: { itemName: "Assam Rice & Dal Ration Packs", availableStock: 1200, unit: "Packs", status: "Optimal" } });
  const resItem2 = await prisma.resourceItem.create({ data: { itemName: "Drinking Water Halogen Tablets & Tanks", availableStock: 14000, unit: "Liters / Tablets", status: "Critical Shortage" } });
  const resItem3 = await prisma.resourceItem.create({ data: { itemName: "First Aid & Anti-Venom Kits", availableStock: 45, unit: "Kits", status: "Optimal" } });
  const resItem4 = await prisma.resourceItem.create({ data: { itemName: "Tarpaulins & Mosquito Nets", availableStock: 250, unit: "Packs", status: "Restock Requested" } });
  const resItem5 = await prisma.resourceItem.create({ data: { itemName: "Baby Food & Milk Powder Packs", availableStock: 25, unit: "Packs", status: "Critical Shortage" } });
  const resItem6 = await prisma.resourceItem.create({ data: { itemName: "Blanket & Warm Clothing Kits", availableStock: 150, unit: "Kits", status: "Optimal" } });

  // Inventory Ledgers (IN/OUT transactions)
  await prisma.inventoryLedger.createMany({
    data: [
      { resourceItemId: resItem1.id, transactionType: "IN", quantity: 1500, donorProviderId: provider2.id, notes: "Direct relief donation from Aman Foundation Central Warehouse", handledByUserId: defaultAdmin.id },
      { resourceItemId: resItem1.id, transactionType: "OUT", quantity: 300, recipientFamilyId: createdFamilies[0].id, notes: "Handed over to Ahmed Family at Bartari School Shelter", handledByUserId: defaultAdmin.id },
      { resourceItemId: resItem2.id, transactionType: "IN", quantity: 20000, donorProviderId: provider4.id, notes: "Red Cross supply dispatch", handledByUserId: defaultAdmin.id },
      { resourceItemId: resItem2.id, transactionType: "OUT", quantity: 6000, recipientProviderId: provider1.id, notes: "Dispatched to Kalgachia Hospital Camp water purification tank", handledByUserId: defaultAdmin.id },
      { resourceItemId: resItem4.id, transactionType: "IN", quantity: 500, donorProviderId: provider2.id, notes: "Logistics warehouse transfer", handledByUserId: defaultAdmin.id },
      { resourceItemId: resItem4.id, transactionType: "OUT", quantity: 250, recipientFamilyId: createdFamilies[2].id, notes: "Mosquito nets distribution in Sawpur Camp", handledByUserId: defaultAdmin.id },
      { resourceItemId: resItem5.id, transactionType: "OUT", quantity: 40, recipientFamilyId: createdFamilies[4].id, notes: "Infant nutrition packages delivered to Moinbari", handledByUserId: defaultAdmin.id }
    ]
  });

  // Broadcast Alert
  // ─── Assessment Templates (FLN, SEL, Subjects) ───
  console.log("Seeding assessment templates...");

  await prisma.FLNCategory.create({
    data: {
      name: "Emergent", order: 1,
      questions: { create: [
        { questionText: "Alphabet sound", marks: 1, order: 1 },
        { questionText: "CVC Words (4 words)", marks: 2, order: 2 }
      ]}
    }
  });
  await prisma.FLNCategory.create({
    data: {
      name: "Beginner", order: 2,
      questions: { create: [
        { questionText: "Consonant blends (beginning)", marks: 2, order: 1 },
        { questionText: "Consonant blends (end)", marks: 2, order: 2 },
        { questionText: "Consonant digraphs", marks: 2, order: 3 },
        { questionText: "Long Vowels (magic E)", marks: 2, order: 4 },
        { questionText: "Vowel Digraphs", marks: 2, order: 5 }
      ]}
    }
  });
  await prisma.FLNCategory.create({
    data: {
      name: "Intermediate", order: 3,
      questions: { create: [
        { questionText: "Multi syllable word (decoding)", marks: 2, order: 1 },
        { questionText: "Reading sentences", marks: 2, order: 2 }
      ]}
    }
  });
  await prisma.FLNCategory.create({
    data: {
      name: "Advanced", order: 4,
      questions: { create: [
        { questionText: "Reading Paragraphs", marks: 3, order: 1 }
      ]}
    }
  });

  const selQTexts = [
    "How difficult is it for you to ask questions in class?",
    "How difficult is it for you to finish work, even when it is hard?",
    "How difficult is it for you to share your feelings with others?",
    "How difficult is it for you to ask others for feedback?",
    "How difficult is it for you to talk about yourself and your family?",
    "How difficult is it for you to set goals for yourself?",
    "How difficult is it for you to ask for help?",
    "How difficult is it for you to make new friends in your class?",
    "How difficult is it for you to share things with your friends?",
    "How difficult is it for you to say sorry when you make a mistake?",
    "How difficult is it for you to work in a group?",
    "How difficult is it for you to learn from people with different opinions?",
    "How difficult is it for you to know how someone is feeling by looking at their face?",
    "How difficult is it for you to understand problems in your class or school?",
    "How difficult is it for you to speak up when you see something unfair, even if others don't?",
    "How difficult is it for you to speak about your community?",
    "How difficult is it for you to be a leader?",
    "How difficult is it for you to solve problems that affect both you and your classmates?",
    "How difficult is it for you to solve problems at home?"
  ];
  for (let i = 0; i < selQTexts.length; i++) {
    await prisma.SELQuestion.create({
      data: {
        questionText: selQTexts[i],
        options: ["Too Easy", "Easy", "Hard", "Too Hard", "Can with Teachers Help"],
        order: i + 1
      }
    });
  }

  await prisma.SubjectAssessmentTemplate.createMany({
    data: [
      { name: "English", options: ["words", "letter", "beginner", "paragraph (STD 1 level text)", "absent"], order: 1 },
      { name: "Assamese", options: ["words", "letter", "beginner", "paragraph (STD 1 level text)", "absent"], order: 2 },
      { name: "Maths", options: ["Number Recognition (1-9)", "Beginner", "Number Recognition (11-99)", "Subtraction", "absent"], order: 3 }
    ]
  });

  console.log("Comprehensive seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
