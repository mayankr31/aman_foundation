export const TITLE_CATEGORIES = {
  C: { label: "Connect", count: 5 },
  E: { label: "Envision", count: 5 },
  P: { label: "Plan", count: 5 },
  X: { label: "Execute", count: 5 },
  R: { label: "Reflect", count: 5 },
};

export const TITLES = (() => {
  const result = [];
  for (const [category, { count }] of Object.entries(TITLE_CATEGORIES)) {
    for (let i = 1; i <= count; i++) {
      result.push(`${category}${i}`);
    }
  }
  return result;
})();

export const LEVELS = ["Novice", "Beginner", "Proficient", "Advanced"];

export const RATING_OPTIONS = [
  "Additional Support Required",
  "Some progress meet but additional support required",
  "Expected progress made",
  "Significant progress made",
];

export const SECTIONS = {
  leadingClassroom: "Leading the classroom",
  leadingMyself: "Leading myself",
  visitingHomes: "Visiting Homes and Communities",
  schoolDevelopment: "School Development",
  y2Fellow: "(Only for Y2 Fellows)\na. Change Projects\nb. Post-Fellowship Clarity",
};

/*
 * Question definitions:
 * - type: "text" = textarea with bullet points
 * - type: "titles" = Leading Myself title+level selections
 * - type: "rating" = dropdown rating
 *
 * For sections like "leadingMyself" that are soms titles and soms text,
 * the type is set on the section level in the QUESTIONS array.
 */

export const QUESTIONS = [
  // Q1: Where am I starting the year?
  {
    id: "Q1",
    label: "Q1. Where am I starting the year?",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q2: What is my Mid Year target?
  {
    id: "Q2",
    label: "Q2. What is my Mid Year target?",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q3: How do I intend to work towards the goal?
  {
    id: "Q3",
    label: "Q3. How do I intend to work towards the goal?",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "text" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q4: Self Reflection progress made my MidLine
  {
    id: "Q4",
    label: "Q4. Self Reflection progress made my MidLine",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q5: Self Rating
  {
    id: "Q5",
    label: "Q5. Self Rating",
    sections: [
      { key: "leadingClassroom", type: "rating" },
      { key: "leadingMyself", type: "rating" },
      { key: "visitingHomes", type: "rating" },
      { key: "schoolDevelopment", type: "rating" },
    ],
  },
  // Q6: Manager Reflection
  {
    id: "Q6",
    label: "Q6. Manager Reflection",
    isManagerOnly: true,
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q7: Manager rating
  {
    id: "Q7",
    label: "Q7. Manager Rating",
    isManagerOnly: true,
    sections: [
      { key: "leadingClassroom", type: "rating" },
      { key: "leadingMyself", type: "rating" },
      { key: "visitingHomes", type: "rating" },
      { key: "schoolDevelopment", type: "rating" },
    ],
  },
  // Q8: What will be my end of the year target?
  {
    id: "Q8",
    label: "Q8. What will be my end of the year target?",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q9: How do I intend to work towards the goal?
  {
    id: "Q9",
    label: "Q9. How do I intend to work towards the goal?",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "text" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q10: Self Reflection Progress made by midline
  {
    id: "Q10",
    label: "Q10. Self Reflection Progress made by midline",
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q11: Self Rating
  {
    id: "Q11",
    label: "Q11. Self Rating",
    sections: [
      { key: "leadingClassroom", type: "rating" },
      { key: "leadingMyself", type: "rating" },
      { key: "visitingHomes", type: "rating" },
      { key: "schoolDevelopment", type: "rating" },
    ],
  },
  // Q12: Manager Reflection
  {
    id: "Q12",
    label: "Q12. Manager Reflection",
    isManagerOnly: true,
    sections: [
      { key: "leadingClassroom", type: "text" },
      { key: "leadingMyself", type: "titles" },
      { key: "visitingHomes", type: "text" },
      { key: "schoolDevelopment", type: "text" },
    ],
  },
  // Q13: Manager Rating
  {
    id: "Q13",
    label: "Q13. Manager Rating",
    isManagerOnly: true,
    sections: [
      { key: "leadingClassroom", type: "rating" },
      { key: "leadingMyself", type: "rating" },
      { key: "visitingHomes", type: "rating" },
      { key: "schoolDevelopment", type: "rating" },
    ],
  },
];

export function getDefaultResponses() {
  const obj = {};
  for (const q of QUESTIONS) {
    obj[q.id] = {};
    for (const s of q.sections) {
      if (s.type === "titles") {
        obj[q.id][s.key] = [];
      } else if (s.type === "rating") {
        obj[q.id][s.key] = "";
      } else {
        obj[q.id][s.key] = "";
      }
    }
    obj[q.id].y2Fellow = "";
  }
  return obj;
}
