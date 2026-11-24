import { UserRole, UserSession } from '../types/ims.ts';

export interface GuardEvaluationResult {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  reason?: string;
  guardFailed?: 'JwtAuthGuard' | 'RolesGuard' | 'CampusScopeGuard' | 'ResourceOwnershipGuard';
}

/**
 * NestJS Guard Pipeline Simulator & Enforcer
 * Replicates the exact production backend guard pipeline in TypeScript:
 * JwtAuthGuard -> RolesGuard -> CampusScopeGuard -> ResourceOwnershipGuard
 */
export class AuthGuardService {
  /**
   * Evaluates if a request is authorized under the 4-layer NestJS pipeline
   */
  static evaluateAccess(
    currentUser: UserSession | null,
    requiredRoles: UserRole[],
    targetCampusId?: string | null,
    ownershipContext?: {
      targetStudentId?: string;
      allowedStudentIds?: string[];
      targetTeacherId?: string;
      allowedTeacherIds?: string[];
      targetClassId?: string;
      allowedClassIds?: string[];
    }
  ): GuardEvaluationResult {
    // 1. JwtAuthGuard
    if (!currentUser) {
      return {
        allowed: false,
        statusCode: 401,
        guardFailed: 'JwtAuthGuard',
        reason: 'Unauthorized: No active JWT session or valid bearer token found.',
      };
    }

    // 2. RolesGuard
    if (requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
      return {
        allowed: false,
        statusCode: 403,
        guardFailed: 'RolesGuard',
        reason: `Forbidden: Current role [${currentUser.role}] does not satisfy required roles [${requiredRoles.join(', ')}].`,
      };
    }

    // 3. CampusScopeGuard
    // Super Admin has global clearance across all campuses
    if (currentUser.role !== 'SUPER_ADMIN' && targetCampusId && targetCampusId !== 'all') {
      const hasCampusClearance = currentUser.allowedCampusIds.includes(targetCampusId);
      if (!hasCampusClearance) {
        return {
          allowed: false,
          statusCode: 403,
          guardFailed: 'CampusScopeGuard',
          reason: `Forbidden: User from campus [${currentUser.allowedCampusIds.join(', ')}] attempted to access protected records belonging to [${targetCampusId}]. Cross-campus access is strictly rejected.`,
        };
      }
    }

    // 4. ResourceOwnershipGuard
    if (ownershipContext) {
      // Parent resource ownership check (only their own children)
      if (currentUser.role === 'PARENT') {
        if (
          ownershipContext.targetStudentId &&
          ownershipContext.allowedStudentIds &&
          !ownershipContext.allowedStudentIds.includes(ownershipContext.targetStudentId)
        ) {
          return {
            allowed: false,
            statusCode: 403,
            guardFailed: 'ResourceOwnershipGuard',
            reason: `Forbidden: Parent [${currentUser.fullName}] does not have legal guardianship over student [${ownershipContext.targetStudentId}].`,
          };
        }
      }

      // Teacher resource ownership check (only assigned classes/students)
      if (currentUser.role === 'TEACHER') {
        if (
          ownershipContext.targetClassId &&
          ownershipContext.allowedClassIds &&
          !ownershipContext.allowedClassIds.includes(ownershipContext.targetClassId)
        ) {
          return {
            allowed: false,
            statusCode: 403,
            guardFailed: 'ResourceOwnershipGuard',
            reason: `Forbidden: Teacher [${currentUser.fullName}] is not assigned to class [${ownershipContext.targetClassId}].`,
          };
        }
      }
    }

    return {
      allowed: true,
      statusCode: 200,
    };
  }

  /**
   * Pre-configured security test scenarios to verify backend guard compliance
   */
  static runSecurityVerificationTests(): {
    testName: string;
    description: string;
    expectedStatus: number;
    actualStatus: number;
    passed: boolean;
    details: string;
  }[] {
    const ukAdmin: UserSession = {
      id: 'usr-admin-uk-01',
      email: 'admin.uk@misbah.org',
      username: 'admin.uk',
      fullName: 'Ustadh Tariq Mahmood',
      role: 'CAMPUS_ADMIN',
      allowedCampusIds: ['uk'],
      activeCampusId: 'uk',
    };

    const teacherUk: UserSession = {
      id: 'usr-teach-uk-01',
      email: 'teacher.uk@misbah.org',
      username: 'qari.hasan',
      fullName: 'Qari Hasan Al-Baqir',
      role: 'TEACHER',
      allowedCampusIds: ['uk'],
      activeCampusId: 'uk',
      teacherProfileId: 'tch-uk-01',
    };

    const parentUk: UserSession = {
      id: 'usr-parent-uk-01',
      email: 'parent.uk@misbah.org',
      username: 'parent.uk',
      fullName: 'Br. Farhan Siddique',
      role: 'PARENT',
      allowedCampusIds: ['uk'],
      activeCampusId: 'uk',
      parentProfileId: 'prt-uk-01',
    };

    const superAdmin: UserSession = {
      id: 'usr-super-01',
      email: 'superadmin@misbah.org',
      username: 'superadmin',
      fullName: 'Shaykh Dr. Muhammad Ibrahim',
      role: 'SUPER_ADMIN',
      allowedCampusIds: ['all', 'uk', 'kts'],
      activeCampusId: 'all',
    };

    const testResults = [
      // Test 1: Cross-Campus Data Access Rejection
      (() => {
        const res = AuthGuardService.evaluateAccess(
          ukAdmin,
          ['SUPER_ADMIN', 'CAMPUS_ADMIN'],
          'kts' // Attempt to access KTS Pakistan Campus student
        );
        return {
          testName: 'Cross-Campus Isolation Test',
          description: 'UK Campus Admin attempts to access KTS Pakistan student record',
          expectedStatus: 403,
          actualStatus: res.statusCode,
          passed: res.statusCode === 403,
          details: res.reason || 'Allowed',
        };
      })(),

      // Test 2: Cross-Role Route Tampering Rejection
      (() => {
        const res = AuthGuardService.evaluateAccess(
          teacherUk,
          ['SUPER_ADMIN', 'CAMPUS_ADMIN'], // Admin-only endpoint
          'uk'
        );
        return {
          testName: 'Role Elevation Prevention Test',
          description: 'Teacher attempts to modify campus fee structure',
          expectedStatus: 403,
          actualStatus: res.statusCode,
          passed: res.statusCode === 403,
          details: res.reason || 'Allowed',
        };
      })(),

      // Test 3: Parent Resource Ownership Isolation
      (() => {
        const res = AuthGuardService.evaluateAccess(
          parentUk,
          ['PARENT'],
          'uk',
          {
            targetStudentId: 'std-uk-03', // Unrelated student (Zayd Kareem)
            allowedStudentIds: ['std-uk-01', 'std-uk-02'], // Own children (Bilal & Maryam)
          }
        );
        return {
          testName: 'Parent Guardianship Ownership Test',
          description: 'Parent attempts to query academic records of an unrelated child',
          expectedStatus: 403,
          actualStatus: res.statusCode,
          passed: res.statusCode === 403,
          details: res.reason || 'Allowed',
        };
      })(),

      // Test 4: Super Admin Global Access
      (() => {
        const res = AuthGuardService.evaluateAccess(
          superAdmin,
          ['SUPER_ADMIN'],
          'kts'
        );
        return {
          testName: 'Super Admin Cross-Campus Authority Test',
          description: 'Super Admin inspects KTS Pakistan financial ledger',
          expectedStatus: 200,
          actualStatus: res.statusCode,
          passed: res.statusCode === 200,
          details: 'Global access confirmed under SUPER_ADMIN privilege',
        };
      })(),
    ];

    return testResults;
  }
}
