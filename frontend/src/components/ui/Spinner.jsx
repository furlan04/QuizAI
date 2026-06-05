const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' };

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <output
      aria-label="Caricamento"
      className={[
        SIZES[size] ?? SIZES.md,
        'inline-block animate-spin rounded-full border-cream border-t-violet border-r-coral',
        className,
      ].filter(Boolean).join(' ')}
    />
  );
}
