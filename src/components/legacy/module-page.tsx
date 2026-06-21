import { getMessages, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { StatusBadge } from '@/components/ui/status-badge';
import { MetricCard, type MetricTone } from '@/components/ui/metric-card';
import {
  panelHeaderDescriptionClass,
  panelHeaderVariants,
  panelShellClass,
  panelTitleClass,
  tableClass,
  tableHeaderCellClass,
  tableHeaderVariants,
  tableRowClass,
} from '@/components/ui/table-styles';
import esMessages from '../../../messages/es.json';

type Tone =
  | 'default'
  | 'neutral'
  | 'brand'
  | 'primary'
  | 'good'
  | 'risk'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'info'
  | 'special'
  | 'accent';

interface Metric {
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
}

interface Action {
  label: string;
  href?: string;
}

interface TableSection {
  type: 'table';
  title: string;
  description?: string;
  headers: string[];
  rows: string[][];
}

interface CardsSection {
  type: 'cards';
  title: string;
  description?: string;
  items: Array<{ title: string; description: string; meta?: string; status?: string }>;
}

interface FormSection {
  type: 'form';
  title: string;
  description?: string;
  fields: string[];
}

interface ModulePageContent {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  metrics?: Metric[];
  tabs?: string[];
  sections: Array<TableSection | CardsSection | FormSection>;
}

interface MessagesShape {
  legacy?: {
    pages?: Record<string, ModulePageContent>;
  };
}

const toneMap: Record<Tone, MetricTone> = {
  default: 'signal',
  neutral: 'neutral',
  brand: 'signal',
  primary: 'primary',
  good: 'good',
  risk: 'risk',
  warning: 'risk',
  critical: 'critical',
  danger: 'critical',
  info: 'info',
  special: 'special',
  accent: 'special',
};

export default async function ModulePage({ locale, pageKey }: { locale: string; pageKey: string }) {
  setRequestLocale(locale);
  const messages = (await getMessages({ locale })) as MessagesShape;
  const fallbackMessages = esMessages as MessagesShape;
  const page = messages.legacy?.pages?.[pageKey] ?? fallbackMessages.legacy?.pages?.[pageKey];

  if (!page) {
    throw new Error(`Missing legacy page copy for ${pageKey}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          {page.eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {page.eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{page.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
            {page.subtitle}
          </p>
        </div>
        {(page.primaryAction || page.secondaryAction) && (
          <div className="flex flex-wrap gap-2 md:justify-end">
            {page.secondaryAction && <ActionButton action={page.secondaryAction} secondary />}
            {page.primaryAction && <ActionButton action={page.primaryAction} />}
          </div>
        )}
      </header>

      {page.tabs && (
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
          {page.tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={
                index === 0
                  ? 'min-h-11 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm'
                  : 'min-h-11 shrink-0 rounded-md px-3 text-sm text-muted-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground'
              }
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {page.metrics && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {page.metrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metricTone(metric, index)}
            />
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {page.sections.map((section) => (
          <section key={section.title} className={panelShellClass}>
            <div className={panelHeaderVariants('accent')}>
              <h2 className={panelTitleClass}>{section.title}</h2>
              {section.description && (
                <p className={panelHeaderDescriptionClass}>{section.description}</p>
              )}
            </div>
            {section.type === 'table' && <TableSectionView section={section} />}
            {section.type === 'cards' && <CardsSectionView section={section} />}
            {section.type === 'form' && <FormSectionView section={section} />}
          </section>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ action, secondary = false }: { action: Action; secondary?: boolean }) {
  const className = secondary
    ? 'inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    : 'inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  if (action.href) {
    return (
      <Link href={action.href as never} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {action.label}
    </button>
  );
}

function TableSectionView({ section }: { section: TableSection }) {
  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead className={tableHeaderVariants('accent')}>
          <tr>
            {section.headers.map((header) => (
              <th key={header} scope="col" className={tableHeaderCellClass}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, rowIndex) => (
            <tr key={row.join('|') || rowIndex} className={tableRowClass}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="px-4 py-3 align-top text-foreground first:font-medium"
                >
                  {renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function metricTone(metric: Metric, index: number): MetricTone {
  if (metric.tone) return toneMap[metric.tone];

  const text = `${metric.label} ${metric.value} ${metric.detail ?? ''}`.toLowerCase();

  if (
    text.includes('adeudo') ||
    text.includes('sin contacto') ||
    text.includes('pendiente') ||
    text.includes('revisión') ||
    text.includes('revisar') ||
    text.includes('bajo mínimo') ||
    text.includes('requiere')
  ) {
    return 'risk';
  }

  if (
    text.includes('vencido') ||
    text.includes('cancelado') ||
    text.includes('rechazado') ||
    text.includes('descuadre')
  ) {
    return 'critical';
  }

  if (
    text.includes('activo') ||
    text.includes('cubierto') ||
    text.includes('pagado') ||
    text.includes('asistencia') ||
    text.includes('diferencia')
  ) {
    return 'good';
  }

  if (
    text.includes('clase') ||
    text.includes('capacidad') ||
    text.includes('salón') ||
    text.includes('dojo') ||
    text.includes('uso') ||
    text.includes('operativo')
  ) {
    return 'info';
  }

  if (text.includes('liga') || text.includes('examen') || text.includes('candidato')) {
    return 'special';
  }

  return index === 0 ? 'signal' : 'info';
}

function statusVariantForCell(cell: string) {
  const normalized = cell.trim().toLowerCase();

  if (
    [
      'activo',
      'activa',
      'operativo',
      'operativa',
      'pagado',
      'cubierto',
      'confirmado',
      'disponible',
      'listo',
      'aprobado',
      'abierta',
    ].includes(normalized)
  ) {
    return 'good' as const;
  }

  if (
    [
      'pendiente',
      'en revisión',
      'por validar',
      'recomendado',
      'invitado',
      'revisar asistencia',
      'actualizar',
      'email pendiente',
    ].includes(normalized)
  ) {
    return 'special' as const;
  }

  if (
    [
      'sin contacto',
      'con adeudo',
      'bajo mínimo',
      'requiere compra',
      'retardo',
      'justificado',
    ].includes(normalized)
  ) {
    return 'risk' as const;
  }

  if (
    ['vencido', 'cancelado', 'rechazado', 'inactivo', 'baja', 'suspendido', 'falta'].includes(
      normalized,
    )
  ) {
    return 'critical' as const;
  }

  if (
    [
      'transferido',
      'en proceso',
      'proceso',
      'captura',
      'registrado',
      'teléfono registrado',
    ].includes(normalized)
  ) {
    return 'info' as const;
  }

  return null;
}

function renderCell(cell: string) {
  const variant = statusVariantForCell(cell);
  return variant ? <StatusBadge variant={variant}>{cell}</StatusBadge> : cell;
}

function CardsSectionView({ section }: { section: CardsSection }) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
      {section.items.map((item) => (
        <article key={item.title} className="rounded-md border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            {item.status && (
              <StatusBadge variant={statusVariantForCell(item.status) ?? 'accent'}>
                {item.status}
              </StatusBadge>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          {item.meta && <div className="mt-3 text-xs text-muted-foreground">{item.meta}</div>}
        </article>
      ))}
    </div>
  );
}

function FormSectionView({ section }: { section: FormSection }) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      {section.fields.map((field) => (
        <label key={field} className="flex flex-col gap-1.5 text-sm font-medium">
          {field}
          <div className="min-h-11 rounded-md border border-dashed border-input bg-card" />
        </label>
      ))}
    </div>
  );
}
