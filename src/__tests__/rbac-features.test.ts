import { describe, it, expect } from 'vitest';
import {
  hasFeature,
  getRoleFeatures,
  assertFeature,
  ForbiddenError,
  FEATURES,
  ROLE_FEATURE_PERMISSIONS,
} from '@/lib/rbac';

describe('RBAC Feature Permissions', () => {
  describe('hasFeature', () => {
    it('student can access workspace', () => {
      expect(hasFeature('student', 'access_workspace')).toBe(true);
    });

    it('student cannot manage users', () => {
      expect(hasFeature('student', 'manage_users')).toBe(false);
    });

    it('student cannot export data', () => {
      expect(hasFeature('student', 'export_data')).toBe(false);
    });

    it('student cannot notify students', () => {
      expect(hasFeature('student', 'notify_students')).toBe(false);
    });

    it('teacher can manage groups', () => {
      expect(hasFeature('teacher', 'manage_groups')).toBe(true);
    });

    it('teacher can notify students', () => {
      expect(hasFeature('teacher', 'notify_students')).toBe(true);
    });

    it('teacher can view student details', () => {
      expect(hasFeature('teacher', 'view_student_details')).toBe(true);
    });

    it('teacher cannot manage users', () => {
      expect(hasFeature('teacher', 'manage_users')).toBe(false);
    });

    it('teacher cannot export data', () => {
      expect(hasFeature('teacher', 'export_data')).toBe(false);
    });

    it('admin has all features', () => {
      for (const feature of Object.values(FEATURES)) {
        expect(hasFeature('admin', feature)).toBe(true);
      }
    });

    it('admin has more features than teacher', () => {
      expect(getRoleFeatures('admin').length).toBeGreaterThan(getRoleFeatures('teacher').length);
    });

    it('teacher has more features than student', () => {
      expect(getRoleFeatures('teacher').length).toBeGreaterThan(getRoleFeatures('student').length);
    });
  });

  describe('getRoleFeatures', () => {
    it('returns correct features for student', () => {
      const features = getRoleFeatures('student');
      expect(features).toContain(FEATURES.access_workspace);
      expect(features).toContain(FEATURES.view_own_progress);
      expect(features).toContain(FEATURES.view_leaderboard);
      expect(features).not.toContain(FEATURES.manage_users);
    });

    it('returns correct features for teacher', () => {
      const features = getRoleFeatures('teacher');
      expect(features).toContain(FEATURES.manage_groups);
      expect(features).toContain(FEATURES.notify_students);
      expect(features).toContain(FEATURES.view_student_details);
      expect(features).not.toContain(FEATURES.manage_users);
      expect(features).not.toContain(FEATURES.ban_users);
    });

    it('admin has all defined features', () => {
      const features = getRoleFeatures('admin');
      expect(features.length).toBe(Object.values(FEATURES).length);
    });
  });

  describe('assertFeature', () => {
    it('does not throw when role has feature', () => {
      expect(() => assertFeature('admin', 'manage_users')).not.toThrow();
    });

    it('throws ForbiddenError when role lacks feature', () => {
      expect(() => assertFeature('student', 'manage_users')).toThrow(ForbiddenError);
      expect(() => assertFeature('student', 'manage_users')).toThrow('manage_users');
    });

    it('throws ForbiddenError for teacher lacking admin features', () => {
      expect(() => assertFeature('teacher', 'ban_users')).toThrow(ForbiddenError);
    });
  });

  describe('ROLE_FEATURE_PERMISSIONS', () => {
    it('every feature is assigned to at least one role', () => {
      const allAssignedFeatures = new Set<string>();
      for (const role of Object.keys(ROLE_FEATURE_PERMISSIONS) as Array<keyof typeof ROLE_FEATURE_PERMISSIONS>) {
        for (const feature of ROLE_FEATURE_PERMISSIONS[role]) {
          allAssignedFeatures.add(feature);
        }
      }
      expect(allAssignedFeatures.size).toBe(Object.values(FEATURES).length);
    });

    it('student has exactly 4 features', () => {
      expect(getRoleFeatures('student').length).toBe(4);
    });
  });
});
