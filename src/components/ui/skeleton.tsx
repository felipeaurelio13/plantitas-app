import { cn } from '../../lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md',
        'bg-[linear-gradient(110deg,var(--color-neutral-200)_8%,var(--color-neutral-300)_18%,var(--color-neutral-200)_33%)]',
        'dark:bg-[linear-gradient(110deg,var(--color-neutral-800)_8%,var(--color-neutral-700)_18%,var(--color-neutral-800)_33%)]',
        'bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton }; 