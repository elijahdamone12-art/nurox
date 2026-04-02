export type TeksStandard = {
  tag: string;
  description: string;
  subject: string;
  grade: number;
};

// Seeded with representative standards for Math 4-7, Science 5-8, ELA 5-8.
const RAW_STANDARDS: TeksStandard[] = [
  // Math Grade 4
  { tag: "4.4B", description: "Determine products of a number and 10 or 100 using properties of operations and place value understandings", subject: "Math", grade: 4 },
  { tag: "4.3C", description: "Determine if two given fractions are equivalent using a variety of methods", subject: "Math", grade: 4 },
  { tag: "4.4A", description: "Add and subtract whole numbers and decimals to the hundredths place using the standard algorithm", subject: "Math", grade: 4 },
  { tag: "4.5A", description: "Represent multi-step problems involving the four operations using strip diagrams and equations", subject: "Math", grade: 4 },
  // Math Grade 5
  { tag: "5.3C", description: "Solve for quotients of decimals to the hundredths, up to four-digit dividends and two-digit whole number divisors", subject: "Math", grade: 5 },
  { tag: "5.3A", description: "Estimate to determine solutions to mathematical and real-world problems involving addition, subtraction, multiplication, or division", subject: "Math", grade: 5 },
  { tag: "5.4A", description: "Identify prime and composite numbers", subject: "Math", grade: 5 },
  { tag: "5.4B", description: "Represent and solve multi-step problems involving the four operations with whole numbers using equations with a letter standing for the unknown quantity", subject: "Math", grade: 5 },
  // Math Grade 6
  { tag: "6.2A", description: "Classify whole numbers, integers, and rational numbers using a visual representation such as a Venn diagram", subject: "Math", grade: 6 },
  { tag: "6.3A", description: "Recognize that dividing by a rational number and multiplying by its reciprocal result in equivalent values", subject: "Math", grade: 6 },
  { tag: "6.4A", description: "Compare two rules verbally, numerically, graphically, and symbolically in the form of y = ax or y = x + a in order to differentiate between additive and multiplicative relationships", subject: "Math", grade: 6 },
  { tag: "6.7A", description: "Generate equivalent numerical expressions using order of operations, including whole number exponents and prime factorization", subject: "Math", grade: 6 },
  // Math Grade 7
  { tag: "7.3A", description: "Add, subtract, multiply, and divide rational numbers fluently", subject: "Math", grade: 7 },
  { tag: "7.4A", description: "Represent constant rates of change in mathematical and real-world problems given pictorial, tabular, verbal, numeric, graphical, and algebraic representations, including d = rt", subject: "Math", grade: 7 },
  { tag: "7.6A", description: "Represent sample spaces for simple and compound events using lists and tree diagrams", subject: "Math", grade: 7 },
  { tag: "7.6B", description: "Select and use different simulations to represent simple and compound events with and without technology", subject: "Math", grade: 7 },
  // Science Grade 5
  { tag: "5.5A", description: "Explore the uses of energy, including mechanical, light, thermal, electrical, and sound energy", subject: "Science", grade: 5 },
  { tag: "5.5B", description: "Demonstrate that the flow of electricity in circuits requires a complete path through which an electric current can pass and explore properties of conductors and insulators", subject: "Science", grade: 5 },
  { tag: "5.6A", description: "Explore and explain that mixtures are made of multiple types of matter and can be separated by physical means", subject: "Science", grade: 5 },
  { tag: "5.8A", description: "Differentiate between weather and climate", subject: "Science", grade: 5 },
  // Science Grade 6
  { tag: "6.5A", description: "Recognize that matter is made up of atoms and that atoms of different elements combine to form compounds", subject: "Science", grade: 6 },
  { tag: "6.6A", description: "Investigate and describe how different forms of energy are transformed from one form to another", subject: "Science", grade: 6 },
  { tag: "6.9A", description: "Describe the physical characteristics of the universe such as stars, nebulae, and galaxies", subject: "Science", grade: 6 },
  { tag: "6.3A", description: "In all fields of science, analyze, evaluate, and critique scientific explanations by using empirical evidence", subject: "Science", grade: 6 },
  // Science Grade 7
  { tag: "7.5A", description: "Recognize that radiant energy from the Sun is transformed into chemical energy through the process of photosynthesis", subject: "Science", grade: 7 },
  { tag: "7.7A", description: "Examine organisms or their structures such as insects or leaves and use dichotomous keys for identification", subject: "Science", grade: 7 },
  { tag: "7.12A", description: "Interpret and explain the neither gained nor lost from a closed system the total mass remains constant", subject: "Science", grade: 7 },
  { tag: "7.9A", description: "Analyze and describe the effects on the environment of events such as floods, hurricanes, or tornadoes and human activities such as pollution or use of resources", subject: "Science", grade: 7 },
  // Science Grade 8
  { tag: "8.5A", description: "Describe the structure of atoms, including the masses, electrical charges, and locations, of protons and neutrons in the nucleus and electrons in the electron cloud", subject: "Science", grade: 8 },
  { tag: "8.6A", description: "Investigate and describe the relationship between force and motion", subject: "Science", grade: 8 },
  { tag: "8.9A", description: "Describe the roles of carbon dioxide and water in the processes of photosynthesis and cellular respiration", subject: "Science", grade: 8 },
  { tag: "8.11A", description: "Examine the evidence that the universe is approximately 14 billion years old", subject: "Science", grade: 8 },
  // ELA Grade 5
  { tag: "5.6A", description: "Describe incidents that advance the story or novel, explaining how each incident gives rise to or foreshadows future events", subject: "ELA", grade: 5 },
  { tag: "5.9A", description: "Explain the difference between theme and moral using evidence from text", subject: "ELA", grade: 5 },
  { tag: "5.11A", description: "Determine the meaning of words and phrases as they are used in text, including figurative language such as metaphors and similes", subject: "ELA", grade: 5 },
  { tag: "5.13A", description: "Identify the author's purpose and explain the controlling idea or thesis", subject: "ELA", grade: 5 },
  // ELA Grade 6
  { tag: "6.6A", description: "Analyze how the central idea is developed over the course of a text", subject: "ELA", grade: 6 },
  { tag: "6.7A", description: "Analyze how the author's use of language, including figurative and technical meanings, influences the reader", subject: "ELA", grade: 6 },
  { tag: "6.9A", description: "Describe how an author's point of view, perspective, or cultural background affects the content and language of the text", subject: "ELA", grade: 6 },
  { tag: "6.11A", description: "Identify and explain the use of literary devices, including hyperbole, paradox, and oxymoron", subject: "ELA", grade: 6 },
  // ELA Grade 7
  { tag: "7.6A", description: "Analyze the influence of the setting, including historical and cultural settings, on the plot", subject: "ELA", grade: 7 },
  { tag: "7.9A", description: "Analyze how the central idea is developed through text structure and literary devices", subject: "ELA", grade: 7 },
  { tag: "7.11A", description: "Analyze how the use of language, including connotation, denotation, imagery, and figurative language, affects the reader's experience", subject: "ELA", grade: 7 },
  { tag: "7.13A", description: "Identify and analyze how an author uses rhetorical devices such as anaphora, antithesis, and rhetorical questions", subject: "ELA", grade: 7 },
  // ELA Grade 8
  { tag: "8.6A", description: "Analyze how plot structure, including rising action, climax, and falling action, develops the theme", subject: "ELA", grade: 8 },
  { tag: "8.9A", description: "Analyze how the central idea of a text is developed through details, word choice, and structure", subject: "ELA", grade: 8 },
  { tag: "8.11A", description: "Analyze the effect of the use of literary devices on the reader, including foreshadowing, flashback, and irony", subject: "ELA", grade: 8 },
  { tag: "8.13A", description: "Identify and explain the author's use of rhetorical strategies including ethos, logos, and pathos in persuasive texts", subject: "ELA", grade: 8 },
];

export type TeksRegistry = Map<string, TeksStandard>;

export const TEKS_REGISTRY: TeksRegistry = new Map(
  RAW_STANDARDS.map((s) => [s.tag, s])
);

export function lookupStandard(tag: string): TeksStandard | undefined {
  return TEKS_REGISTRY.get(tag.trim().toUpperCase());
}

export function getStandardsBySubject(subject: string): TeksStandard[] {
  return RAW_STANDARDS.filter((s) => s.subject === subject);
}

export function getStandardsByGrade(grade: number): TeksStandard[] {
  return RAW_STANDARDS.filter((s) => s.grade === grade);
}

export function getStandardsBySubjectAndGrade(subject: string, grade: number): TeksStandard[] {
  return RAW_STANDARDS.filter((s) => s.subject === subject && s.grade === grade);
}
