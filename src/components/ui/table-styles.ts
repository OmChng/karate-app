export const tableShellClass =
  'overflow-x-auto rounded-lg border border-border bg-card shadow-sm shadow-black/10';

export const tableClass = 'w-full text-sm';

export type TableTone =
  | 'primary'
  | 'signal'
  | 'good'
  | 'success'
  | 'risk'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'info'
  | 'special'
  | 'accent';

const tableHeaderToneClass: Record<TableTone, string> = {
  primary: 'border-purple bg-purple text-purple-foreground',
  signal: 'border-primary-border bg-primary text-primary-foreground',
  good: 'border-success-border bg-success-subtle text-success-subtle-foreground',
  success: 'border-success-border bg-success-subtle text-success-subtle-foreground',
  risk: 'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  warning: 'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  critical: 'border-danger-border bg-danger-subtle text-danger-subtle-foreground',
  danger: 'border-danger-border bg-danger-subtle text-danger-subtle-foreground',
  info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
  special: 'border-accent-border bg-accent-subtle text-accent-subtle-foreground',
  accent: 'border-accent-border bg-accent-subtle text-accent-subtle-foreground',
};

export function tableHeaderVariants(tone: TableTone = 'primary') {
  return `border-b text-left text-xs uppercase tracking-wide ${tableHeaderToneClass[tone]}`;
}

export const tableHeaderClass = tableHeaderVariants('primary');

export const tableRowClass =
  'data-table-row border-b border-border transition-colors duration-fast ease-standard last:border-0';

export const tableHeaderCellClass = 'px-3 py-2 text-center align-middle font-semibold';

export const tableCellClass = 'px-3 py-3 align-top text-foreground';
