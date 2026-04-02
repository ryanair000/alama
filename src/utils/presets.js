export const ASSESSMENT_PRESETS = [
  {
    label: 'CAT 1 + CAT 2 + Main Exam',
    desc: 'CAT 1 (15), CAT 2 (15), Main Exam (70)',
    components: [
      { name: 'CAT 1', maxMark: 15 },
      { name: 'CAT 2', maxMark: 15 },
      { name: 'Main Exam', maxMark: 70 },
    ],
  },
  {
    label: 'CAT + Assignment + Main Exam',
    desc: 'CAT (15), Assignment (15), Main Exam (70)',
    components: [
      { name: 'CAT', maxMark: 15 },
      { name: 'Assignment', maxMark: 15 },
      { name: 'Main Exam', maxMark: 70 },
    ],
  },
  {
    label: 'Coursework + Main Exam',
    desc: 'Coursework (30), Main Exam (70)',
    components: [
      { name: 'Coursework', maxMark: 30 },
      { name: 'Main Exam', maxMark: 70 },
    ],
  },
  {
    label: 'CAT + Practical + Main Exam',
    desc: 'CAT (15), Practical (15), Main Exam (70)',
    components: [
      { name: 'CAT', maxMark: 15 },
      { name: 'Practical', maxMark: 15 },
      { name: 'Main Exam', maxMark: 70 },
    ],
  },
];
