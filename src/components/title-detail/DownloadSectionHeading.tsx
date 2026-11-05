export function DownloadSectionHeading() {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span aria-hidden="true" className="h-6 w-2.5 rounded-full bg-primary" />
      <h2 className="text-lg font-semibold">لینک‌های دانلود</h2>
    </div>
  );
}

export function NoLinksMessage() {
  return (
    <p className="rounded-xl bg-primary/5 px-4 py-6 text-center text-sm text-muted-foreground">
      هنوز لینک دانلودی برای این عنوان ثبت نشده است.
    </p>
  );
}
