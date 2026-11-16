// Default definition of the Post Fellowship Survey (Look Beyond Survey / LBS).
// Admins can override this from Admin → Surveys. Question/option ids match the
// historic hard-coded form so existing responses keep rendering.

const AGREEMENT_OPTIONS = [
  { id: "Strongly disagree", label: "Strongly disagree" },
  { id: "Disagree", label: "Disagree" },
  { id: "Agree", label: "Agree" },
  { id: "Strongly agree", label: "Strongly agree" },
];

const EXTENT_OPTIONS = [
  { id: "To a great extent", label: "To a great extent" },
  { id: "Somewhat", label: "Somewhat" },
  { id: "Little", label: "Little" },
  { id: "Not at all", label: "Not at all" },
];

const HELPFUL_OPTIONS = [
  { id: "Extremely helpful", label: "Extremely helpful" },
  { id: "Mostly helpful", label: "Mostly helpful" },
  { id: "Somewhat helpful", label: "Somewhat helpful" },
  { id: "Not helpful", label: "Not helpful" },
];

const STUDY_COURSES = [
  { id: "Business-related degree (for ex. MBA, Law, etc)", label: "Business-related degree (for ex. MBA, Law, etc)" },
  { id: "Education-related degree (for ex. Master or PHD in Ed, etc)", label: "Education-related degree (for ex. Master or PHD in Ed, etc)" },
  {
    id: "Development-related degree (for ex. Master in Public Policy, International Relations, etc)",
    label: "Development-related degree (for ex. Master in Public Policy, International Relations, etc)",
  },
  { id: "Other", label: "Other" },
  { id: "I am unsure", label: "I am unsure" },
];

const EXAM_COURSES = [
  { id: "Related to Business", label: "Related to Business" },
  { id: "Related to Education", label: "Related to Education" },
  { id: "Related to Development Sector", label: "Related to Development Sector" },
  { id: "Others (Please specify)", label: "Others (Please specify)" },
];

const BREAK_PLANS = [
  { id: "Family commitments", label: "Family commitments" },
  { id: "Travel", label: "Travel" },
  { id: "Other", label: "Other" },
];

const BTCP_STAGES = [
  { id: "Not yet started", label: "Not yet started" },
  { id: "Ideation", label: "Ideation" },
  { id: "Planning", label: "Planning" },
  { id: "Implementation", label: "Implementation" },
  { id: "Closing out", label: "Closing out" },
];

const BTCP_RATINGS = [
  {
    id: "I have access to helpful and timely support and resources towards my BTCP",
    label: "I have access to helpful and timely support and resources towards my BTCP",
  },
  {
    id: "My BTCP is helping me increase my understanding of the education ecosystem",
    label: "My BTCP is helping me increase my understanding of the education ecosystem",
  },
  {
    id: "My BTCP is helping me build or practice skills that I can transfer and apply to my post-Fellowship choices/careers",
    label: "My BTCP is helping me build or practice skills that I can transfer and apply to my post-Fellowship choices/careers",
  },
];

const DEPTH_TRACKS = [
  { id: "Aspiring School Leadership Track", label: "Aspiring School Leadership Track" },
  { id: "Public Sector Track", label: "Public Sector Track" },
  { id: "iLab", label: "iLab" },
  { id: "Fellow Advisory Track", label: "Fellow Advisory Track" },
  { id: "Others", label: "Others" },
];

const Q1_OPTIONS = [
  { id: "a", label: "I would like to study" },
  { id: "b", label: "I will be preparing for competitive exams" },
  { id: "c", label: "I would like to work" },
  { id: "d", label: "I will be starting my own organization" },
  { id: "e", label: "I am on sabbatical and will return to my employer" },
  { id: "f", label: "I have decided to take a break" },
  { id: "g", label: "I am unsure" },
];

const PATHWAY_GROUPS = [
  {
    id: "transformational",
    heading: "1. Transformational Schools (towards children from low-income communities)",
    options: [
      { id: "ts_teaching", label: "a. Teaching" },
      { id: "ts_school_leadership", label: "b. School Leadership" },
      { id: "ts_school_entrepreneurship", label: "c. School Entrepreneurship" },
      { id: "ts_after_school", label: "d. After School Programs and Community Centers" },
    ],
  },
  {
    id: "enablers",
    heading: "2. Enablers of transformational schools (towards children from low-income communities)",
    options: [
      { id: "en_service_people", label: "a. Service Provider (People)" },
      { id: "en_service_product", label: "b. Service Provider (Product)" },
      { id: "en_intermediary", label: "c. Intermediary" },
      { id: "en_funding", label: "d. Funding" },
    ],
  },
  {
    id: "policy",
    heading: "3. Policy and governance",
    options: [
      { id: "pg_consulting", label: "a. Governance Consulting" },
      { id: "pg_fellowships", label: "b. Government Fellowships" },
      { id: "pg_bureaucracy", label: "c. Bureaucracy" },
      { id: "pg_politics", label: "d. Politics" },
    ],
  },
  {
    id: "other",
    heading: "4. Other Pathways",
    options: [
      {
        id: "op_edu_sector",
        label:
          "a. Working in the education sector, but not specifically focused on children from low-income communities",
      },
      {
        id: "op_dev_ecosystem",
        label:
          "b. Working in the larger development ecosystem, but not focused on the education system",
      },
      {
        id: "op_not_impacting",
        label:
          "c. Working in roles not impacting educational outcomes or children from low-income backgrounds directly/ indirectly",
      },
      { id: "op_other", label: "d. Other (please specify)" },
    ],
  },
  {
    id: "unsure",
    heading: "5. Unsure",
    options: [{ id: "u_unsure", label: "Unsure" }],
  },
];

const Q8_OPTIONS = [
  { id: "pathway_exposure", label: "Pathway Exposure Series" },
  { id: "theory_of_change", label: "Personal Theory of Change workshop" },
  { id: "org_immersions", label: "Org Immersions" },
  { id: "one_on_one", label: "1-on-1 Conversations with City Staff" },
  { id: "microsite", label: "Post-Fellowship Support Microsite" },
  {
    id: "depth_tracks",
    label: "Depth Tracks",
    followUp: {
      id: "q8_depth_track_choice",
      type: "select",
      optionSetId: "depth_tracks",
      label: "Please choose the track that you accessed:",
      required: true,
      otherOptionId: "Others",
      otherFieldId: "q8_depth_track_other",
      otherLabel: "Please specify",
    },
  },
  {
    id: "internship",
    label: "Internship/ Apprenticeship",
    followUp: {
      id: "q8_internship_org",
      type: "textarea",
      label: "Please can you name the organisation you did your apprenticeship/internship with?",
      placeholder: "Organisation name...",
      required: true,
    },
  },
];

export const POST_FELLOWSHIP_SURVEY_TEMPLATE = {
  version: 1,
  key: "POST_FELLOWSHIP",
  title: "Post Fellowship Survey",
  intro: "Please take a few minutes to share your post-Fellowship plans and reflections.",
  notice: "",
  dateLabel: "Survey Date",
  optionSets: [
    { id: "agreement", name: "Agreement scale", options: AGREEMENT_OPTIONS },
    { id: "extent", name: "Extent scale", options: EXTENT_OPTIONS },
    { id: "helpful", name: "Helpfulness scale", options: HELPFUL_OPTIONS },
    { id: "study_courses", name: "Study courses", options: STUDY_COURSES },
    { id: "exam_courses", name: "Competitive exam courses", options: EXAM_COURSES },
    { id: "break_plans", name: "Break plans", options: BREAK_PLANS },
    { id: "btcp_stages", name: "BTCP stages", options: BTCP_STAGES },
    { id: "btcp_ratings", name: "BTCP experience ratings", options: BTCP_RATINGS },
    { id: "depth_tracks", name: "Depth tracks", options: DEPTH_TRACKS },
    { id: "q1_plans", name: "Post-Fellowship plans", options: Q1_OPTIONS },
  ],
  sections: [
    {
      id: "section1",
      label: "Section 1: Post-Fellowship Plans",
      note: "Please share your current thinking around your plans right after the Fellowship.",
    },
    { id: "section2-beliefs", label: "Section 2: Puzzle Piece Alignment — Beliefs", note: "" },
    { id: "section2-knowledge", label: "Section 2: Puzzle Piece Alignment — Knowledge of prioritized puzzle pieces", note: "" },
    { id: "section2-pathways", label: "Section 2: Puzzle Piece Alignment — Pathway preferences", note: "" },
    { id: "section3-support", label: "Section 3: Support and Opportunities provided — Feedback on support", note: "" },
    { id: "section3-other", label: "Section 3: Support and Opportunities provided — Overall feedback", note: "" },
  ],
  questions: [
    {
      id: "q1",
      sectionId: "section1",
      label:
        "Which statement, out of the following, best describes your current thinking around your plans right after the Fellowship?",
      type: "radio",
      optionSetId: "q1_plans",
      required: true,
    },
    {
      id: "q1_study_course",
      sectionId: "section1",
      label: "What course(s) are you aspiring to get into?",
      type: "select",
      optionSetId: "study_courses",
      required: true,
      indent: true,
      numberMode: "hidden",
      showIf: { all: [{ questionId: "q1", anyOf: ["a"] }] },
    },
    {
      id: "q1_study_other",
      sectionId: "section1",
      label: "Please specify",
      type: "textarea",
      required: true,
      indent: true,
      numberMode: "hidden",
      placeholder: "Please specify...",
      showIf: { all: [{ questionId: "q1_study_course", anyOf: ["Other"] }] },
    },
    {
      id: "q1_exam_course",
      sectionId: "section1",
      label: "What course(s) are you aspiring to get into?",
      type: "select",
      optionSetId: "exam_courses",
      required: true,
      indent: true,
      numberMode: "hidden",
      showIf: { all: [{ questionId: "q1", anyOf: ["b"] }] },
    },
    {
      id: "q1_exam_other",
      sectionId: "section1",
      label: "Please specify",
      type: "textarea",
      required: true,
      indent: true,
      numberMode: "hidden",
      placeholder: "Please specify...",
      showIf: { all: [{ questionId: "q1_exam_course", anyOf: ["Others (Please specify)"] }] },
    },
    {
      id: "q1_break_plan",
      sectionId: "section1",
      label: "What do you plan on doing during your break?",
      type: "select",
      optionSetId: "break_plans",
      required: true,
      indent: true,
      numberMode: "hidden",
      showIf: { all: [{ questionId: "q1", anyOf: ["f"] }] },
    },
    {
      id: "q1_break_other",
      sectionId: "section1",
      label: "Please specify",
      type: "textarea",
      required: true,
      indent: true,
      numberMode: "hidden",
      placeholder: "Please specify...",
      showIf: { all: [{ questionId: "q1_break_plan", anyOf: ["Other"] }] },
    },
    {
      id: "q1_unsure_reason",
      sectionId: "section1",
      label: "What is making you unsure?",
      type: "textarea",
      required: true,
      indent: true,
      numberMode: "hidden",
      placeholder: "Please share your thoughts...",
      showIf: { all: [{ questionId: "q1", anyOf: ["g"] }] },
    },
    {
      id: "q2",
      sectionId: "section2-beliefs",
      label:
        "I have an evolving idea of the role I will play as an Alum of Aman Foundation towards educational equity",
      type: "select",
      optionSetId: "agreement",
      required: true,
    },
    {
      id: "q3",
      sectionId: "section2-beliefs",
      label:
        "I believe the Fellowship experience is helping me grow the capabilities I need (e.g., knowledge, skills, mindsets, etc.) to develop personally and professionally",
      type: "select",
      optionSetId: "agreement",
      required: true,
    },
    {
      id: "q4",
      sectionId: "section2-knowledge",
      label:
        "I am familiar with and understand Aman Foundation's 3 prioritized puzzle pieces (Transformational Schools, Enablers of Transformation Outcomes, Policy and Governance)",
      type: "select",
      optionSetId: "extent",
      required: true,
    },
    {
      id: "q5",
      sectionId: "section2-knowledge",
      label:
        "I am aware of the types of roles and organizations within Aman Foundation's 3 prioritized puzzle pieces",
      type: "select",
      optionSetId: "extent",
      required: true,
    },
    {
      id: "q6",
      sectionId: "section2-knowledge",
      label:
        "I am aware of how my strengths align or do not align with the types of opportunities available within Aman Foundation's 3 prioritized puzzle pieces",
      type: "select",
      optionSetId: "extent",
      required: true,
    },
    {
      id: "q7",
      sectionId: "section2-pathways",
      label:
        "What are the top 3 pathways you envision yourself working in when you seek a work opportunity in the future?",
      labelWhen: [
        {
          questionId: "q1",
          anyOf: ["c", "d", "e"],
          label:
            "What are the top 3 pathways you envision yourself working in right after the Fellowship?",
        },
      ],
      type: "rank",
      limit: 3,
      required: true,
      showIf: { all: [{ questionId: "q1", anyOf: ["a", "b", "c", "d", "e", "f", "g"] }] },
      helperText:
        "Select exactly 3 options. The order you select them determines their rank (1st, 2nd, 3rd). Click an option again to deselect it.",
      groups: PATHWAY_GROUPS,
      otherOptionId: "op_other",
      otherFieldId: "q7_other_text",
      otherLabel: "Please specify the other pathway",
      validationMessage: "Please select and rank exactly 3 pathways",
    },
    {
      id: "q8",
      sectionId: "section3-support",
      label:
        "Which of the following opportunities created by Aman Foundation have you accessed in your post-Fellowship exploration and search? (Select all that apply)",
      type: "multiSelect",
      required: false,
      rating: {
        enabled: true,
        optionSetId: "helpful",
        label: "How helpful was this?",
      },
      options: Q8_OPTIONS,
    },
    {
      id: "q9_btcp",
      sectionId: "section3-support",
      label: "Have you done a Be The Change Project (BTCP)?",
      type: "radio",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
      required: true,
    },
    {
      id: "q9_btcp_stage",
      sectionId: "section3-support",
      label: "Which stage of your BTCP are you on?",
      type: "select",
      optionSetId: "btcp_stages",
      required: true,
      indent: true,
      numberMode: "hidden",
      showIf: { all: [{ questionId: "q9_btcp", anyOf: ["yes"] }] },
    },
    {
      id: "q9_btcp_rating",
      sectionId: "section3-support",
      label: "Please select the option that best describes your experience:",
      type: "select",
      optionSetId: "btcp_ratings",
      required: true,
      indent: true,
      numberMode: "hidden",
      showIf: {
        all: [
          { questionId: "q9_btcp", anyOf: ["yes"] },
          {
            questionId: "q9_btcp_stage",
            anyOf: ["Ideation", "Planning", "Implementation", "Closing out"],
          },
        ],
      },
    },
    {
      id: "q9_btcp_reason",
      sectionId: "section3-support",
      label: "Please share the reason for not doing the BTCP",
      type: "textarea",
      required: true,
      indent: true,
      numberMode: "hidden",
      placeholder: "Please share your reason...",
      showIf: { all: [{ questionId: "q9_btcp", anyOf: ["no"] }] },
    },
    {
      id: "q10",
      sectionId: "section3-other",
      label:
        "If you have accessed any other opportunities or created some for yourself that helped with your post-Fellowship exploration and search, please mention them below.",
      type: "textarea",
      required: false,
      placeholder: "Please describe any other opportunities...",
    },
    {
      id: "q11",
      sectionId: "section3-other",
      label:
        "The support offered by Aman Foundation towards post-Fellowship is of high quality and is suited to my needs",
      type: "select",
      optionSetId: "agreement",
      required: true,
    },
    {
      id: "q12",
      sectionId: "section3-other",
      label:
        "With respect to your post-Fellowship plans, please share any recommendations to strengthen the quality or type of support that Aman Foundation can offer to Fellows",
      type: "textarea",
      required: false,
      placeholder: "Please share your recommendations...",
    },
  ],
  archivedQuestions: [],
};

export default POST_FELLOWSHIP_SURVEY_TEMPLATE;
