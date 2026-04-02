export const DEFAULT_GRADING_SCALE = [
  { grade: 'A', min: 70, max: 100 },
  { grade: 'B', min: 60, max: 69 },
  { grade: 'C', min: 50, max: 59 },
  { grade: 'D', min: 40, max: 49 },
  { grade: 'E', min: 0, max: 39 },
];

export const DEFAULT_PASS_MARK = 40;

export function getGrade(total, scale) {
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  for (const tier of sorted) {
    if (total >= tier.min && total <= tier.max) {
      return tier.grade;
    }
  }
  return 'E';
}

export function calculateTotal(student, components) {
  if (!components || components.length === 0) {
    return student.total ?? 0;
  }
  return components.reduce((sum, comp) => {
    const val = parseFloat(student.marks?.[comp.id] ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
}

export function validateComponentMarks(components) {
  const total = components.reduce((sum, c) => sum + (parseFloat(c.maxMark) || 0), 0);
  return Math.abs(total - 100) < 0.01;
}

export function computeStats(students, passMark) {
  if (!students || students.length === 0) {
    return {
      count: 0, average: 0, highest: 0, lowest: 0,
      passCount: 0, failCount: 0, passRate: 0,
    };
  }
  const totals = students.map(s => s.computedTotal ?? 0);
  const sum = totals.reduce((a, b) => a + b, 0);
  const passCount = totals.filter(t => t >= passMark).length;
  return {
    count: students.length,
    average: +(sum / students.length).toFixed(2),
    highest: Math.max(...totals),
    lowest: Math.min(...totals),
    passCount,
    failCount: students.length - passCount,
    passRate: +((passCount / students.length) * 100).toFixed(1),
  };
}

export function computeGradeDistribution(students, scale) {
  const dist = {};
  scale.forEach(tier => { dist[tier.grade] = 0; });
  students.forEach(s => {
    const g = s.computedGrade;
    if (g in dist) dist[g]++;
    else dist[g] = 1;
  });
  return scale.map(tier => ({
    grade: tier.grade,
    count: dist[tier.grade] || 0,
    percentage: students.length > 0
      ? +(((dist[tier.grade] || 0) / students.length) * 100).toFixed(1)
      : 0,
  }));
}
