import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("Seeding assessment templates...");

  // Clear existing assessment template data
  await prisma.FLNQuestion.deleteMany({});
  await prisma.FLNCategory.deleteMany({});
  await prisma.SELQuestion.deleteMany({});
  await prisma.SubjectAssessmentTemplate.deleteMany({});

  // ─── FLN Categories with Questions ───
  const cat1 = await prisma.FLNCategory.create({
    data: { name: "Emergent", order: 1 }
  });
  await prisma.FLNQuestion.createMany({
    data: [
      { categoryId: cat1.id, questionText: "Alphabet sound", marks: 1, order: 1 },
      { categoryId: cat1.id, questionText: "CVC Words (4 words)", marks: 2, order: 2 }
    ]
  });

  const cat2 = await prisma.FLNCategory.create({
    data: { name: "Beginner", order: 2 }
  });
  await prisma.FLNQuestion.createMany({
    data: [
      { categoryId: cat2.id, questionText: "Consonant blends (beginning)", marks: 2, order: 1 },
      { categoryId: cat2.id, questionText: "Consonant blends (end)", marks: 2, order: 2 },
      { categoryId: cat2.id, questionText: "Consonant digraphs", marks: 2, order: 3 },
      { categoryId: cat2.id, questionText: "Long Vowels (magic E)", marks: 2, order: 4 },
      { categoryId: cat2.id, questionText: "Vowel Digraphs", marks: 2, order: 5 }
    ]
  });

  const cat3 = await prisma.FLNCategory.create({
    data: { name: "Intermediate", order: 3 }
  });
  await prisma.FLNQuestion.createMany({
    data: [
      { categoryId: cat3.id, questionText: "Multi syllable word (decoding)", marks: 2, order: 1 },
      { categoryId: cat3.id, questionText: "Reading sentences", marks: 2, order: 2 }
    ]
  });

  const cat4 = await prisma.FLNCategory.create({
    data: { name: "Advanced", order: 4 }
  });
  await prisma.FLNQuestion.createMany({
    data: [
      { categoryId: cat4.id, questionText: "Reading Paragraphs", marks: 3, order: 1 }
    ]
  });

  console.log(`  Created ${4} FLN categories with ${2 + 5 + 2 + 1} questions`);

  // ─── SEL Questions ───
  const selQuestionTexts = [
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

  await prisma.SELQuestion.createMany({
    data: selQuestionTexts.map((text, i) => ({
      questionText: text,
      options: ["Too Easy", "Easy", "Hard", "Too Hard", "Can with Teachers Help"],
      order: i + 1
    }))
  });
  console.log(`  Created ${selQuestionTexts.length} SEL questions`);

  // ─── Subject Assessment Templates ───
  await prisma.SubjectAssessmentTemplate.createMany({
    data: [
      { name: "English", options: ["words", "letter", "beginner", "paragraph (STD 1 level text)", "absent"], order: 1 },
      { name: "Assamese", options: ["words", "letter", "beginner", "paragraph (STD 1 level text)", "absent"], order: 2 },
      { name: "Maths", options: ["Number Recognition (1-9)", "Beginner", "Number Recognition (11-99)", "Subtraction", "absent"], order: 3 }
    ]
  });
  console.log(`  Created ${3} subject templates`);

  console.log("Assessment templates seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
