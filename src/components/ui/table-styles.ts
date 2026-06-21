export const tableShellClass =
  'overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]';

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

export type PanelTone = TableTone | 'neutral' | 'brand';

export const panelShellClass =
  'overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]';

const panelHeaderToneClass: Record<PanelTone, string> = {
  neutral: 'bg-secondary text-secondary-foreground',
  brand: 'bg-primary text-primary-foreground',
  primary: 'bg-primary text-primary-foreground',
  signal: 'bg-primary text-primary-foreground',
  good: 'bg-success text-success-foreground',
  success: 'bg-success text-success-foreground',
  risk: 'bg-warning text-warning-foreground',
  warning: 'bg-warning text-warning-foreground',
  critical: 'bg-danger text-danger-foreground',
  danger: 'bg-danger text-danger-foreground',
  info: 'bg-info text-info-foreground',
  special: 'bg-section-header text-section-header-foreground',
  accent: 'bg-section-header text-section-header-foreground',
};

const tableHeaderToneClass: Record<TableTone, string> = {
  primary: 'border-primary bg-primary text-primary-foreground',
  signal: 'border-primary bg-primary text-primary-foreground',
  good: 'border-success bg-success text-success-foreground',
  success: 'border-success bg-success text-success-foreground',
  risk: 'border-warning bg-warning text-warning-foreground',
  warning: 'border-warning bg-warning text-warning-foreground',
  critical: 'border-danger bg-danger text-danger-foreground',
  danger: 'border-danger bg-danger text-danger-foreground',
  info: 'border-info bg-info text-info-foreground',
  special: 'border-section-header bg-section-header text-section-header-foreground',
  accent: 'border-section-header bg-section-header text-section-header-foreground',
};

export function tableHeaderVariants(tone: TableTone = 'accent') {
  return `border-b text-left text-xs font-semibold uppercase tracking-wide ${tableHeaderToneClass[tone]}`;
}

export function panelHeaderVariants(tone: PanelTone = 'accent') {
  return `border-b border-b-border p-4 ${panelHeaderToneClass[tone]}`;
}

export const panelTitleClass = 'text-base font-semibold text-current';

export const panelHeaderDescriptionClass = 'mt-1 text-sm leading-6 text-current/80';

export const tableHeaderClass = tableHeaderVariants('accent');

export const tableRowClass =
  'data-table-row border-b border-border transition-colors duration-fast ease-standard last:border-0';

export const tableHeaderCellClass = 'px-3 py-2 text-center align-middle font-semibold';

export const tableCellClass = 'px-3 py-3 align-top text-foreground';
