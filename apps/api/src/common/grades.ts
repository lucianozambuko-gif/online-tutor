// Specific grades a tutor can tag themselves with within the Primary/High
// School phases — validated here rather than as a Prisma enum so the list
// stays easy to extend without a migration.
export const PRIMARY_GRADES = [
  'Grade R',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
] as const;

export const HIGH_SCHOOL_GRADES = [
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
] as const;

export const SPECIFIC_GRADES = [
  ...PRIMARY_GRADES,
  ...HIGH_SCHOOL_GRADES,
] as const;

export type SpecificGrade = (typeof SPECIFIC_GRADES)[number];
