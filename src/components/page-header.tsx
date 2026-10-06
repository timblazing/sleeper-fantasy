/**
 * The one page heading every route renders. League and draft set the
 * pattern — a title with a one-line description that says what the reader is looking
 * at — and this keeps the type scale and spacing identical across all of them.
 */
export function PageHeader({ description, title }: { description: string; title: string }) {
  return (
    <header>
      <h1 className="text-[1.875rem] font-medium leading-[1.1] tracking-[-0.04em] md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </header>
  );
}
