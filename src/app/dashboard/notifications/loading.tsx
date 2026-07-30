export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl border border-app-border bg-app-surface" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-app-border bg-app-surface"
          />
        ))}
      </div>
    </div>
  );
}
