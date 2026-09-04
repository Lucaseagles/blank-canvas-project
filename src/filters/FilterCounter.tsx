export function FilterCounter({ count }: { count: number }) {
  return <span aria-live="polite" className="min-w-6 rounded-full bg-primary/10 px-2 py-1 text-center text-xs font-bold tabular-nums text-primary transition-all duration-200">{count}</span>;
}
