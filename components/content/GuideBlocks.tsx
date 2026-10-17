import type { Locale } from '@/types/rail';
import type { GuideArticle } from '@/types/rail';
import { Info, TriangleAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const calloutTone = {
  info: {
    box: 'border-brand-200 bg-brand-50/70 dark:border-brand-400/20 dark:bg-brand-500/10',
    icon: 'text-brand-700 dark:text-brand-300',
    Icon: Info,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-500/10',
    icon: 'text-signal-ink dark:text-orange-300',
    Icon: TriangleAlert,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10',
    icon: 'text-emerald-700 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
} as const;

export function GuideBlocks({ article, locale }: { article: GuideArticle; locale: Locale }) {
  const ar = locale === 'ar';

  return (
    <div className="article-prose">
      {article.blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2 key={index} id={`section-${index}`} className="scroll-mt-24">
              {ar ? block.textAr : block.textEn}
            </h2>
          );
        }
        if (block.type === 'paragraph') {
          return <p key={index}>{ar ? block.textAr : block.textEn}</p>;
        }
        if (block.type === 'list') {
          const items = (ar ? block.itemsAr : block.itemsEn) ?? [];
          return (
            <ul key={index}>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        const tone = calloutTone[block.tone ?? 'info'];
        const Icon = tone.Icon;
        return (
          <div key={index} className={cn('my-4 flex gap-2.5 rounded-xl border p-3.5 text-sm leading-7', tone.box)}>
            <Icon className={cn('mt-1 h-4 w-4 shrink-0', tone.icon)} aria-hidden />
            <p className="m-0 text-ink dark:text-slate-200">{ar ? block.textAr : block.textEn}</p>
          </div>
        );
      })}
    </div>
  );
}

export function guideSections(article: GuideArticle, locale: Locale) {
  return article.blocks
    .map((block, index) => ({ block, index }))
    .filter((entry) => entry.block.type === 'heading')
    .map((entry) => ({
      id: `section-${entry.index}`,
      label: (locale === 'ar' ? entry.block.textAr : entry.block.textEn) ?? '',
    }));
}
