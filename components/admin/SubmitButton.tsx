'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function SubmitButton({
  children,
  variant = 'primary',
  size = 'sm',
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonClasses({ variant, size }), className)}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
