import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" size={48} />
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
