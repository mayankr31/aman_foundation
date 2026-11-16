/**
 * Single source of truth for the Household Resilience (KYR) tool.
 *
 * Question ids, wording, options and grid rows mirror the official
 * "Resilience Movement - HH level KYR tool" form. The form renderer, the
 * read-only viewer and the scoring helpers all read from this file so the
 * three never drift apart.
 *
 * Types:
 *   radio        - single choice
 *   checkbox     - multiple choice
 *   text         - free text
 *   number       - numeric text input
 *   date / time  - native inputs
 *   composite    - a question made of several labelled sub-fields
 *   amountRange  - Minimum / Maximum pair
 *   grid         - matrix, one choice per row
 *   gridMulti    - matrix, multiple choices per row
 */

export const KYR_SECTIONS = [
  {
    id: "A",
    title: "Consent",
    intro:
      "This household resilience measurement tool helps you to assess your families capacity to absorb, adapt and transform your lives when exposed to sudden and severe disturbances. We hope that this tool serves as a road map for your resilience journey showcasing your current position while also illuminating the way forward. Your participation in using this tool is voluntary and will take about half an hour of your time. You need to answer the questions posed from the perspective of the household. If you have any questions about the study, we would be happy to answer those for you. No one except the CSO team will be able to see your personal information. Your responses will also not be shared in an identifiable manner with anyone. An electronic version of the data will be stored without any personally identifiable information. In case you are not interested to participate you are free to drop out at any time. Do you consent for the same?",
    questions: [
      {
        id: "A1",
        type: "radio",
        text: "Do you consent for the same?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "B",
    title: "Respondent's Details",
    intro: "",
    questions: [
      {
        id: "B1",
        type: "composite",
        text: "Date & Time of start of Interview",
        fields: [
          { key: "B1_Date", label: "Date", type: "date" },
          { key: "B1_Time", label: "Time", type: "time" },
        ],
        required: true,
      },
      { id: "B2", type: "text", text: "What is your name", profileKey: "name" },
      {
        id: "B3",
        type: "radio",
        text: "What is your Gender?",
        options: ["Male", "Female", "Others"],
        profileKey: "gender",
      },
      {
        id: "B4",
        type: "composite",
        text: "State / District / Block",
        fields: [
          { key: "B4_State", label: "State", profileKey: "state" },
          { key: "B4_District", label: "District", profileKey: "district" },
          { key: "B4_Block", label: "Block", profileKey: "block" },
        ],
      },
      {
        id: "B5",
        type: "composite",
        text: "Gaon Panchayat / Village",
        fields: [
          { key: "B5_GP", label: "Gaon Panchayat", profileKey: "ward" },
          { key: "B5_Village", label: "Village", profileKey: "village" },
        ],
      },
      {
        id: "B6",
        type: "number",
        text: "What is the total number of members (including children, adults and elderly) in your household including yourself?",
        profileKey: "householdSize",
      },
      {
        id: "B7",
        type: "checkbox",
        text: "Do you live with following members?",
        options: ["Elderly parents or in-laws", "Adult children", "A spouse"],
      },
      {
        id: "B8",
        type: "radio",
        text: "Who is the head of your household?",
        options: ["Myself", "My spouse", "My Parents/In Laws", "Adult Son", "Adult Daughter"],
      },
      {
        id: "B9",
        type: "checkbox",
        text: "What are your sources of income? Please indicate all the sources of income is currently having (Please select all that apply)",
        options: [
          "Wage Labour (casual or contract)",
          "Salaried employment (public or private sector)",
          "Farming on own land",
          "Livestock rearing (milk, meat, eggs, animal sales)",
          "Business or self-employment (non-agricultural)",
          "Agricultural services (equipment rental, custom farming)",
          "Fishing, forestry, or collection from commons (e.g., NTFPs, firewood)",
          "Remittances (from migrants or family members)",
          "Pension or government transfers (e.g., old-age, widow, disability)",
          "Rental income (land, buildings, machinery)",
          "Other (specify)",
        ],
        otherField: "B9_Other",
        otherOption: "Other (specify)",
      },
      {
        id: "B9_Primary",
        displayId: "B9.a",
        type: "text",
        text: "Among the above selected once, which is the primary income source for the family? (choose one among the selections made in B.9 and write the option number, e.g. 1, 2 ...)",
      },
      {
        id: "B10",
        type: "radio",
        text: "Do your livelihood activities need specific equipment to produce income? (e.g., farm equipment, shops)",
        options: ["Yes", "No"],
      },
      {
        id: "B11",
        type: "amountRange",
        text: "Please share monthly income of your family",
        fields: [
          { key: "B11_Min", label: "Minimum", type: "number" },
          { key: "B11_Max", label: "Maximum", type: "number" },
        ],
        profileKey: "monthlyIncome",
      },
      {
        id: "B12",
        type: "amountRange",
        text: "Please share monthly expenses of your family",
        fields: [
          { key: "B12_Min", label: "Minimum", type: "number" },
          { key: "B12_Max", label: "Maximum", type: "number" },
        ],
        required: true,
      },
      {
        id: "B13",
        type: "radio",
        text: "What is the community group your family belongs to?",
        options: ["General", "OBC", "SC", "ST", "Minority", "Other"],
        otherField: "B13_Other",
        otherOption: "Other",
        profileKey: "caste",
      },
      {
        id: "B14",
        type: "gridMulti",
        text: "Who all are responsible for making decisions on the following topics (select everyone who participates):",
        rows: [
          "Education",
          "Skill development",
          "Jobs/Livelihood",
          "Money Matters (loans, savings etc.)",
          "Buying/Selling Assets",
          "Food",
          "Domestic chores (buying groceries, cooking, cleaning)",
          "Health (Physical) / Health (Mental)",
          "Entertainment",
          "Spiritual & Religious",
          "Marriage",
          "NGO/Community level activities",
          "Connecting with others",
        ],
        cols: ["Me", "Spouse", "Parents", "Adult children"],
      },
    ],
  },
  {
    id: "C",
    title: "Current Life Situation",
    intro:
      "Now I'm going to ask you a few questions about how your family feels about your current life situation and whether you want to make any changes.",
    questions: [
      {
        id: "C1",
        type: "radio",
        text: "As a household, how satisfied are you with your current life situation overall (health, finance, education, job, social connections, emotional)?",
        options: [
          "Extremely dissatisfied",
          "Somewhat dissatisfied",
          "Satisfied",
          "Extremely satisfied",
        ],
        required: true,
      },
      {
        id: "C2",
        type: "radio",
        text: "Do you feel that you need to change your current life situation for the better?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "C3",
        type: "radio",
        text: "Do you feel that you have the power to change to better your life situation?",
        options: ["No", "Not Sure", "Yes"],
        required: true,
      },
      {
        id: "C4",
        type: "radio",
        text: "Do you feel that you need the help of others to improve your life situation?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "D",
    title: "Planning",
    intro: "",
    questions: [
      {
        id: "D1",
        type: "grid",
        text: "Do you have specific plans for the following for the next 1 year?",
        rows: [
          "Children's Education (if applicable)",
          "Adult education (if applicable)",
          "Increasing your Income",
          "Major expenditures (events, weddings, festivals)",
          "Routine cash savings",
          "Cash for any unexpected crises",
          "Reducing high interest loans (if applicable)",
          "Insurance (life, livelihood, health)",
          "Creating assets (land, site, building home)",
        ],
        cols: ["Yes", "No", "NA"],
        required: true,
      },
      {
        id: "D2",
        type: "checkbox",
        text: "If you need money, who would you get it from? (Multiple options)",
        options: [
          "Friends and family",
          "Nationalized banks",
          "Co-operative banks",
          "Private banks",
          "Self-help group",
          "Money lenders",
          "MFI (micro finance institutions)",
        ],
        required: true,
      },
    ],
  },
  {
    id: "E",
    title: "Disaster Preparedness",
    intro:
      "Next, I'd like to understand what your family does to prepare for things like floods, storms, or other disasters.",
    questions: [
      {
        id: "E1",
        type: "radio",
        text: "Do you keep anything ready in case of a flood, storm, or other emergency? (e.g., food, torch, documents, water, medicines etc)",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "E2",
        type: "radio",
        text: "Do you and your family have a plan about what to do if a disaster comes?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "E3",
        type: "radio",
        text: "Have you changed anything in your home, work, or habits after a past disaster or warning?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "E4",
        type: "radio",
        text: "Do you talk with neighbors or others about what to do if a disaster comes?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "E5",
        type: "radio",
        text: "Do you usually make any plans before a disaster happens?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "F",
    title: "Disaster Belief",
    intro:
      "Now I'll ask about how you and your family think about disasters—whether you believe they can be planned for or not.",
    questions: [
      {
        id: "F1",
        type: "radio",
        text: "Do you think there is no need to prepare unless something actually happens?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "F2",
        type: "radio",
        text: "Some people believe disasters are just fate or God's will, and that nothing can be done. Do you agree?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "F3",
        type: "radio",
        text: "Do you feel that no matter what you do, it won't change what is meant to happen?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "F4",
        type: "radio",
        text: "Do you avoid thinking or talking about disasters because it is too scary or not helpful?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "G",
    title: "Disaster Mindset",
    intro: "",
    questions: [
      {
        id: "G1",
        type: "radio",
        text: "If a disaster happens, do you mainly wait for the government or others to help?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "G2",
        type: "radio",
        text: "Do you depend on others to tell you what to do during a disaster?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "G3",
        type: "radio",
        text: "Do you believe disasters won't happen again in your area?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "H",
    title: "Financial Resilience",
    intro:
      "Now I'll ask some questions about your family's money, loans, and whether you have things like savings, insurance, or assets you could use in a crisis.",
    questions: [
      {
        id: "H1",
        type: "radio",
        text: "Do you have things like land, gold, livestock, or tools that you could sell if your family faced a crisis?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "H2",
        type: "radio",
        text: "Does your household save money regularly (e.g. monthly, weekly etc.)?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "H3",
        type: "radio",
        text: "Does your household have outstanding loans?",
        options: [
          "Yes, from formal sources",
          "Yes, from informal sources",
          "No, because I don't need loans",
          "No, because I can't get loans (lack of documents/assets)",
          "I don't know",
        ],
        required: true,
      },
      {
        id: "H4",
        type: "radio",
        text: "Are you paying a high interest (more than 24% per year) for any of your outstanding loans?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "H5",
        type: "grid",
        text: "What are the sources of your loans and current outstanding?",
        rows: [
          "Friends and family",
          "Nationalized banks",
          "Self-help group",
          "Money lenders",
          "MFI (micro finance institutions)",
          "Co-operative banks",
          "Private banks",
        ],
        cols: ["> 100K", "10K - 100K", "< 10K", "Don't Know"],
      },
      {
        id: "H6",
        type: "number",
        text: "At present what is the highest rate of interest per annum you are paying for your loans? (if greater than 120%, select 120%)",
      },
      {
        id: "H7",
        type: "radio",
        text: "Does your household have a plan to reduce the high interest debt (if any)?",
        options: ["Yes", "No", "Not Applicable"],
        required: true,
      },
      {
        id: "H8",
        type: "radio",
        text: "Does your household have a monthly budget plan for your expenses and income?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "H9",
        type: "radio",
        text: "Does your household own physical assets (such as agricultural land, plot, constructed building)?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "H10",
        type: "radio",
        text: "Does your household have insurance for your livelihood activities and equipment (e.g., crop insurance, equipment insurance)?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "I",
    title: "Health Resilience",
    intro:
      "Now I'll ask some questions about your family's access to health care, insurance, clean water, and toilets.",
    questions: [
      {
        id: "I1",
        type: "radio",
        text: "If you need health care, which of the facilities do you routinely access?",
        options: [
          "Public health clinics/hospitals",
          "Private health clinics/hospitals",
          "None",
        ],
        required: true,
      },
      {
        id: "I2",
        type: "radio",
        text: "Do you have health insurance for any of the members of the household?",
        options: ["Yes", "No", "Not Applicable"],
        required: true,
      },
      {
        id: "I3",
        type: "radio",
        text: "Do you know how to use any of the insurance you have (livelihood, health, life)?",
        options: ["Yes", "No", "Not Applicable"],
        required: true,
      },
      {
        id: "I4",
        type: "radio",
        text: "Do you have clean drinking water for your home?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "I5",
        type: "radio",
        text: "Do you have toilet facilities with water for your household use?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "J",
    title: "Social Connect",
    intro:
      "Now I'll ask about whether you're part of any local groups or government programs, and who you can turn to if your family faces a crisis.",
    questions: [
      {
        id: "J1",
        type: "radio",
        text: "Is your household a member of local groups or organizations?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "J2",
        type: "radio",
        text: "Do you have people (friends and family) you can trust to help you if you experience a crisis?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "J3",
        type: "radio",
        text: "In an emergency, is there someone you can borrow money from easily (like a moneylender or friend)?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "K",
    title: "Social Protection",
    intro: "",
    questions: [
      {
        id: "K1",
        type: "grid",
        text: "Do you get benefits from any of the following government schemes?",
        rows: [
          "Ration Card",
          "MGNREGA",
          "Old Age Pension",
          "Disability Pension",
          "Widow Pension",
          "Kisan Nidhi Scheme",
          "Ayushman Bharat",
          "Mudra Loan",
          "Life Insurance (PMJJBY)",
          "Accident Insurance (PMSBY)",
          "Crop Insurance (PMFBY)",
        ],
        cols: [
          "Not Eligible",
          "Not aware about eligibility",
          "Eligible but don't have",
          "I am eligible and I have",
        ],
        required: true,
      },
      {
        id: "K2",
        type: "radio",
        text: "Do you think you can rely on government schemes during the times of crisis?",
        options: ["No", "Not Sure", "Yes"],
        required: true,
      },
    ],
  },
  {
    id: "L",
    title: "Disaster Awareness",
    intro:
      "Next, I'd like to ask about whether your family gets warnings before disasters and knows where to go for help if something happens.",
    questions: [
      {
        id: "L1",
        type: "radio",
        text: "Do you know where to go or who to ask for help if a disaster happens?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "L2",
        type: "radio",
        text: "Do you usually get warning messages before a disaster (like from phone, TV, or others)?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    id: "M",
    title: "Vulnerability Assessment",
    intro:
      "Now I want to ask about shocks your family has experienced in the past —like floods, illness, or job loss —and how those affected your household.",
    questions: [
      {
        id: "M1",
        type: "checkbox",
        text: "What were the major interruptions/shocks your household has experienced in the past?",
        options: [
          "Flooding",
          "Drought",
          "Earthquake",
          "Cyclone",
          "Pandemic",
          "Crop Failure (pests etc.)",
          "Unseasonal rain",
          "Heatwave",
          "Extreme Cold",
          "Communal clashes",
          "Personal Tragedy",
          "Health shocks",
          "Others (please specify)",
        ],
        otherField: "M1_Other",
        otherOption: "Others (please specify)",
        required: true,
      },
      {
        id: "M2",
        type: "text",
        text: "What is the biggest interruption/shock your household has experienced in the past?",
      },
      {
        id: "M3",
        type: "radio",
        text: "When did the interruption of ... happen?",
        options: ["In the last 1 year", "1 to 3 years", "3 to 5 years", "more than 5 years ago"],
        required: true,
      },
      {
        id: "M4",
        type: "radio",
        text: "How severe was the impact of this shock?",
        options: ["Very severe", "Moderate", "No impact"],
        required: true,
      },
      {
        id: "M5",
        type: "checkbox",
        text: "Did you have insurance for the following when the disaster happened?",
        options: [
          "Home",
          "Physical assets (agricultural land, plot)",
          "Life Crops",
          "Livestock",
          "Health",
          "Livelihood",
        ],
      },
      {
        id: "M6",
        type: "checkbox",
        text: "How did you respond to the interruption caused by ...? Please select all that apply.",
        options: [
          "Used the cash savings",
          "Claimed insurance benefits",
          "Took help from friends and family",
          "Took help from local organizations",
          "Received government relief (disaster schemes)",
          "Borrowed money from money lender",
          "Borrowed money from bank",
          "Pledged/sold movable assets like jewellery, bicycle, bike, TV, utensils",
          "Migrated",
          "Moved out of the dwelling / left the place",
          "Took on more work / extra work",
          "Withdrew children from school and put them to work",
          "More family members started working",
          "Did not do anything",
          "Other (please specify)",
        ],
        otherField: "M6_Other",
        otherOption: "Other (please specify)",
      },
      {
        id: "M7",
        type: "radio",
        text: "To what extent have you recovered from the interruption caused by ...?",
        options: [
          "We have not recovered",
          "Somewhat recovered",
          "Completely recovered",
          "Doing better than before the shock",
        ],
      },
      {
        id: "M8",
        type: "radio",
        text: "To what extent did your response of '...' help in your recovery?",
        options: ["Made things worse", "Not helpful", "Somewhat helpful", "Very helpful"],
      },
      {
        id: "M9",
        type: "radio",
        text: "If your household were to experience another shock (it could be anything), do you think you can handle it?",
        options: ["No", "Unsure", "Yes"],
        required: true,
      },
      {
        id: "M10",
        type: "radio",
        text: "If your life is interrupted by a shock such as ..., how long can you continue to meet your household expenses with the savings/cash you have?",
        options: [
          "Less than a week",
          "Up to one month",
          "Up to six months",
          "Up to a year",
          "More than a year",
        ],
      },
      {
        id: "M11",
        type: "radio",
        text: "If your life is interrupted by a ..., is there any other way you can make an income?",
        options: [
          "We don't want to do anything else to make an income",
          "We want to but we can't get an alternative income",
          "Yes, please describe below",
        ],
        otherField: "M11_Other",
        otherOption: "Yes, please describe below",
        otherLabel: "Please describe",
      },
      {
        id: "M12",
        type: "number",
        text: "Suppose you urgently need cash to deal with a shock (it could be anything), about how much money can you immediately generate?",
      },
      {
        id: "M13",
        type: "radio",
        text: "When something bad happens, as a family, do you feel you bounce back quickly?",
        options: ["No", "Unsure", "Yes"],
        required: true,
      },
      {
        id: "M14",
        type: "radio",
        text: "Is your home in an area that is often affected by floods or storms or other natural disasters?",
        options: ["No", "Unsure", "Yes"],
      },
      {
        id: "M15",
        type: "radio",
        text: "If your family faced a serious issue —like a land dispute, a theft, or a legal problem —do you know where to go for help?",
        options: ["No", "Unsure", "Yes"],
      },
      {
        id: "M16",
        type: "radio",
        text: "As a family, do you make any plans beyond the next one year?",
        options: ["No", "Unsure", "Yes"],
      },
    ],
  },
];

export const KYR_QUESTIONS = KYR_SECTIONS.flatMap((section) => section.questions);
export const KYR_QUESTION_BY_ID = Object.fromEntries(
  KYR_QUESTIONS.map((question) => [question.id, question])
);

/** Final scorecard printed at the end of the paper form. */
export const KYR_SCORECARD = [
  { key: "lifeSatisfactionScore", label: "Life Satisfaction and Agency" },
  { key: "disasterReadinessScore", label: "Disaster Readiness" },
  { key: "disasterBeliefsScore", label: "Disaster Beliefs" },
  { key: "disasterMindsetScore", label: "Disaster Mindset (Dependency)" },
  { key: "financialResilienceScore", label: "Disaster Financial Preparedness" },
  { key: "healthResilienceScore", label: "Health and Basic Services Preparedness" },
  { key: "socialConnectednessScore", label: "Social Connectedness" },
  { key: "socialProtectionScore", label: "Social Protection Enrollment and Beliefs" },
  { key: "disasterWarningScore", label: "Disaster Warning Awareness" },
  { key: "vulnerabilityScore", label: "Resilience Enhancement Items" },
];

/** Questions whose answers come from the participant profile. */
export const KYR_PROFILE_QUESTION_IDS = [
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
  "B11",
  "B13",
];

export const KYR_COMMUNITY_OPTIONS = ["General", "OBC", "SC", "ST", "Minority", "Other"];

const GENDER_ALIASES = {
  male: "Male",
  female: "Female",
  other: "Others",
  others: "Others",
  "don't want to respond": "Others",
  "do not want to respond": "Others",
  "prefer not to say": "Others",
};

const textMap = {};
KYR_QUESTIONS.forEach((question) => {
  textMap[question.id] = question.text;
  (question.fields || []).forEach((field) => {
    textMap[field.key] = field.label;
  });
  if (question.otherField) {
    textMap[question.otherField] = question.otherLabel || "Other (specify)";
  }
});

/** Resolve the display text for a stored response key (including sub-fields). */
export function getKyrQuestionText(key) {
  return textMap[key] || "";
}

/**
 * Build the prefill values (and the ids that should be locked) for a
 * participant profile. Works for both the beneficiary API object and the
 * add-participant form state because they share the same field names.
 */
export function buildKyrProfilePrefill(source = {}) {
  const prefill = {};
  const locks = [];

  const set = (key, value) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (text) prefill[key] = text;
  };

  set("B2", source.name);

  const genderAlias = GENDER_ALIASES[String(source.gender || "").trim().toLowerCase()];
  if (genderAlias) set("B3", genderAlias);

  set("B4_State", source.state);
  set("B4_District", source.district);
  set("B4_Block", source.block);
  set("B5_GP", source.ward);
  set("B5_Village", source.village);
  set("B6", source.householdSize);

  if (source.monthlyIncome !== undefined && source.monthlyIncome !== null) {
    const income = String(source.monthlyIncome).trim();
    if (income) {
      prefill["B11_Min"] = income;
      prefill["B11_Max"] = income;
    }
  }

  const caste = String(source.caste || "").trim();
  if (caste) {
    const canonical = KYR_COMMUNITY_OPTIONS.find(
      (option) => option.toLowerCase() === caste.toLowerCase()
    );
    if (canonical) {
      prefill.B13 = canonical;
    } else {
      prefill.B13 = "Other";
      prefill.B13_Other = caste;
    }
  }

  if (prefill.B2) locks.push("B2");
  if (prefill.B3) locks.push("B3");

  if (prefill.B4_State && prefill.B4_District && prefill.B4_Block) {
    locks.push("B4");
  } else {
    ["B4_State", "B4_District", "B4_Block"].forEach((key) => {
      if (prefill[key]) locks.push(key);
    });
  }

  if (prefill.B5_GP && prefill.B5_Village) {
    locks.push("B5");
  } else {
    ["B5_GP", "B5_Village"].forEach((key) => {
      if (prefill[key]) locks.push(key);
    });
  }

  if (prefill.B6) locks.push("B6");
  if (prefill.B11_Min) locks.push("B11");
  if (prefill.B13) locks.push("B13");

  return { prefill, locks };
}
