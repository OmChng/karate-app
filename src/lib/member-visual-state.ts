import type { StatusBadgeVariant } from '@/components/ui/status-badge';
import type { MemberStatus } from '@/server/members/schemas';
import type { AbsenceLevel } from '@/server/members/schemas';

export function getAbsenceVariant(level: AbsenceLevel): StatusBadgeVariant {
  switch (level) {
    case 'none':
      return 'good';
    case 'warning':
      return 'risk';
    case 'warningStrong':
      return 'riskStrong';
    case 'danger':
      return 'critical';
  }
}

export function getStudentStatusVariant(status: MemberStatus): StatusBadgeVariant {
  switch (status) {
    case 'active':
      return 'good';
    case 'temporary_leave':
      return 'risk';
    case 'permanent_leave':
      return 'critical';
    case 'recovery':
      return 'special';
    case 'sick':
      return 'riskStrong';
  }
}
