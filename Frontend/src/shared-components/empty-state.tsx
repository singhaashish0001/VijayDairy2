import type { ElementType, ReactNode } from 'react';
import { Cheese, Cow, Drops, MilkBottle, MilkCan } from './illustrations/dairy-illustrations';

type EmptyIllustration = 'bottle' | 'cheese' | 'cow' | 'can' | 'drops';

interface EmptyStateProps {
  icon?: ElementType;
  /** Optional dairy illustration shown instead of the plain icon badge. */
  illustration?: EmptyIllustration;
  title: string;
  description?: string;
  action?: ReactNode;
}

const ART: Record<EmptyIllustration, ReactNode> = {
  bottle: <MilkBottle size={84} />,
  cheese: <Cheese size={100} />,
  cow: <Cow size={130} />,
  can: <MilkCan size={90} />,
  drops: <Drops size={64} />,
};

/** Illustration (or icon) + message shown in place of an empty table body or chart. */
const EmptyState = ({ icon: Icon, illustration, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    {illustration ? (
      <div className="animate-float mb-1">{ART[illustration]}</div>
    ) : (
      Icon && (
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary/70">
          <Icon size={22} strokeWidth={1.5} />
        </div>
      )
    )}
    <span className="text-sm font-semibold text-slate-600">{title}</span>
    {description && <span className="text-xs text-slate-400 max-w-xs">{description}</span>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
