export type UserRole = 'student' | 'teacher' | 'admin';
export const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

export interface TimeRangeFilters {
  start_date?: number;
  end_date?: number;
}
