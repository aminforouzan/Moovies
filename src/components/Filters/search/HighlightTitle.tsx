export function HighlightTitle(title: string, query: string) {
  const q = query.trim();
  if (!q) return title;
  const lower = title.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <span className="rounded bg-yellow-300 px-0.5 text-black">
        {title.slice(idx, idx + q.length)}
      </span>
      {title.slice(idx + q.length)}
    </>
  );
}
