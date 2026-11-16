// Default definition of the Fellow Engagement Survey.
// Admins can override this from Admin → Surveys. The saved template lives in
// the SurveyTemplate table; this object is used until a custom version exists.
//
// Question ids, option ids and response keys are intentionally identical to the
// historic hard-coded form so previously submitted responses keep rendering.

const AGREEMENT_OPTIONS = [
  { id: "Strongly disagree", label: "Strongly disagree" },
  { id: "Disagree", label: "Disagree" },
  { id: "Agree", label: "Agree" },
  { id: "Strongly agree", label: "Strongly agree" },
];

const GENDER_OPTIONS = [
  { id: "Male", label: "Male" },
  { id: "Female", label: "Female" },
  { id: "Transgender", label: "Transgender" },
  { id: "Non-binary", label: "Non-binary" },
  { id: "Prefer not to disclose", label: "Prefer not to disclose" },
];

const YES_NO_DISCLOSE_OPTIONS = [
  { id: "Yes", label: "Yes" },
  { id: "No", label: "No" },
  { id: "Prefer not to disclose", label: "Prefer not to disclose" },
];

const FREQUENCY_OPTIONS = [
  { id: "Once a week", label: "Once a week" },
  { id: "Once in two weeks", label: "Once in two weeks" },
  { id: "Once in three weeks", label: "Once in three weeks" },
  { id: "Once a month", label: "Once a month" },
  { id: "Once in two months", label: "Once in two months" },
  {
    id: "Just once since the new academic year started",
    label: "Just once since the new academic year started",
  },
];

const Q20_DESCRIPTION = [
  "a. facilitates conversations that provide useful and timely feedback on my performance",
  "b. helps me set ambitious goals and reflect on my growth as a teacher and leader.",
  "c. operates with empathy and holds space for me when I am going through challenges",
  "d. encourages me to solve challenges coming my way",
  "e. facilitates reflections for me to make connections between my growth as a teacher and leader",
];

const AGREEMENT = "agreement";

export const ENGAGEMENT_SURVEY_TEMPLATE = {
  version: 1,
  key: "ENGAGEMENT",
  title: "Fellow Engagement Survey",
  intro: "Please take a few minutes to share your experience and feedback.",
  notice:
    "Please note that these questions will be used to understand aggregate trends, and will not be used to reveal the identity of the Fellow.",
  dateLabel: "Survey Date",
  optionSets: [
    { id: AGREEMENT, name: "Agreement scale", options: AGREEMENT_OPTIONS },
    { id: "gender", name: "Gender", options: GENDER_OPTIONS },
    { id: "yes_no_disclose", name: "Yes / No / Prefer not to disclose", options: YES_NO_DISCLOSE_OPTIONS },
    { id: "frequency", name: "Observation frequency", options: FREQUENCY_OPTIONS },
  ],
  sections: [
    { id: "demographics", label: "Demographics", note: "" },
    {
      id: "section1",
      label: "Section 1 — Belief Questions",
      note:
        "Before proceeding with the survey, we request you to take a few minutes to reflect on your Fellowship journey since the start of this academic year.",
    },
    {
      id: "section2",
      label: "Section 2 — Culture",
      note:
        "In the following section, we would like to understand how you feel about Aman Foundation's culture, alignment of your experience, and progress towards your goal so far.",
    },
    { id: "section2b", label: "Section 2 — Expectations, Well-being and Progress", note: "" },
    {
      id: "section3",
      label: "Section 3 — Support",
      note:
        "In this section, we would like you to reflect on the quality of support you have received from your Program Manager/Manager.",
    },
    {
      id: "section4",
      label: "Section 4 — Quality of L&D Spaces",
      note:
        "In this section, we would like you to reflect on the opportunities and resources you have accessed to provide your students with an excellent education.",
    },
    {
      id: "section5",
      label: "Section 5 — Overall Feedback",
      note:
        "In this last section, we would love for you to share your overall experience with the Aman Foundation Fellowship program. We will appreciate your valuable feedback.",
    },
  ],
  questions: [
    {
      id: "q1",
      sectionId: "demographics",
      label: "I identify as ______",
      type: "select",
      optionSetId: "gender",
      required: true,
    },
    {
      id: "q2",
      sectionId: "demographics",
      label:
        "I share the background (economic, racial, ethnic, religious, etc.) of the most disadvantaged groups in India",
      type: "select",
      optionSetId: "yes_no_disclose",
      required: true,
    },
    {
      id: "q3",
      sectionId: "section1",
      label:
        "I have a growing understanding of why all children in Assam today do not attain a quality education and livelihood opportunities",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q4",
      sectionId: "section1",
      label: "I believe it is possible for all children in Assam to attain quality education",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q5",
      sectionId: "section2",
      label:
        "My journey at Aman Foundation so far has been a good investment in my personal and professional development.",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q6",
      sectionId: "section2",
      label: "I feel supported by the Aman Foundation Staff",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q7",
      sectionId: "section2",
      label: "I feel comfortable in approaching my Program Manager and Senior Leadership Team",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q8",
      sectionId: "section2",
      label: "I feel part of a community, where peers help each other drive impact collectively",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q9",
      sectionId: "section2",
      label: "I find purpose and meaning in the work I do",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q10",
      sectionId: "section2",
      label: "I am proud to be a part of Aman Foundation",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q11",
      sectionId: "section2",
      label: "I plan to stay in touch with the Aman Foundation Alumni community after my Fellowship",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q12",
      sectionId: "section2",
      label: "There are repercussions when a Fellow/Staff performs poorly or acts against our core values",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q13",
      sectionId: "section2b",
      label: "I know what is expected of me in my role",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q14",
      sectionId: "section2b",
      label:
        "My day-to-day experiences match the expectations that were set when I went through the recruitment and selection process",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q14Reason",
      sectionId: "section2b",
      label:
        "What would you have liked to know about the Fellowship experience before starting the Fellowship?",
      type: "textarea",
      numberMode: "fixed",
      fixedNumber: "14a",
      required: true,
      placeholder: "Please share your thoughts...",
      showIf: { all: [{ questionId: "q14", anyOf: ["Strongly disagree", "Disagree"] }] },
    },
    {
      id: "q15",
      sectionId: "section2b",
      label:
        "My organization provides me with the resources and support I need to manage my well-being",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q16",
      sectionId: "section2b",
      label:
        "I feel equipped to build relationships with school & Community stakeholders and deal with challenges at school & Community level",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q17",
      sectionId: "section2b",
      label: "Aman Foundation creates an inclusive environment for me",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q18",
      sectionId: "section2b",
      label: "My feedback is welcomed and valued",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q19",
      sectionId: "section2b",
      label: "People who perform well are recognized for it",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
    },
    {
      id: "q20",
      sectionId: "section3",
      label: "My PM/Manager",
      type: "select",
      optionSetId: AGREEMENT,
      required: true,
      descriptionList: Q20_DESCRIPTION,
    },
    {
      id: "q21",
      sectionId: "section3",
      label:
        "Since the beginning of the academic year, my PM/Manager has observed my class and shared feedback through technical notes/conversations at the following frequency",
      type: "select",
      optionSetId: "frequency",
      required: true,
    },
    {
      id: "q22",
      sectionId: "section4",
      label:
        "Since the start of the year, which of the following learning and development spaces have you accessed? (Select all that apply)",
      type: "multiSelect",
      required: false,
      rating: {
        enabled: true,
        optionSetId: AGREEMENT,
        label: "How effective was this?",
      },
      options: [
        {
          id: "a",
          label: "Institute prepared me with the adequate foundational skills to begin teaching",
          bold: "Institute",
          ratingKey: "q22a",
        },
        {
          id: "b",
          label: "Technical trainings help me upskill and develop as a teacher",
          bold: "Technical trainings",
          ratingKey: "q22b",
        },
        {
          id: "c",
          label:
            "Learning Circle (or Community Circle for TTF) is a safe and effective space to connect and build relationships, problem solve, share best practices and reflect on progress",
          bold: "Learning Circle (or Community Circle for TTF)",
          ratingKey: "q22c",
        },
      ],
    },
    {
      id: "q23",
      sectionId: "section4",
      label:
        "Based on all the learning and development opportunities that Aman Foundation provides, what aspects of them have you found to be helpful or what could be strengthened?",
      type: "textarea",
      required: false,
      placeholder: "Please share your feedback...",
    },
    {
      id: "q24",
      sectionId: "section5",
      label:
        "On a scale of 0-10 (0 being the lowest), how likely is it that you would recommend the Fellowship to any qualified individual you know?",
      type: "scale",
      min: 0,
      max: 10,
      required: true,
    },
    {
      id: "q24Reason",
      sectionId: "section5",
      label: "Please share the reason for your rating",
      type: "textarea",
      numberMode: "fixed",
      fixedNumber: "24a",
      required: true,
      placeholder: "Please share your reason...",
      showIf: { all: [{ questionId: "q24", lt: 6 }] },
    },
    {
      id: "q25",
      sectionId: "section5",
      label:
        "Based on your experience, what are the top two aspects of the Fellowship program that you like the most?",
      type: "textarea",
      required: true,
      placeholder: "Please describe...",
    },
    {
      id: "q26",
      sectionId: "section5",
      label:
        "Based on your experience, what are the top 2 areas that Aman Foundation can focus on to enhance your experience with the Fellowship program?",
      type: "textarea",
      required: true,
      placeholder: "Please describe...",
    },
  ],
  archivedQuestions: [],
};

export default ENGAGEMENT_SURVEY_TEMPLATE;
