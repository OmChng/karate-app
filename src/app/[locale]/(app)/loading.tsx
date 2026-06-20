import { useTranslations } from 'next-intl';
import { PageLoading } from '@/components/ui/loading';

export default function Loading() {
  const t = useTranslations('loading');
  return <PageLoading label={t('page')} />;
}
