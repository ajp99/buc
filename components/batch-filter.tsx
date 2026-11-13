import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pill links that set ?batch=<id> on the current list page. */
export function BatchFilter({ basePath, batches, current, allLabel }: {
  basePath: string;
  batches: { id: string; name: string }[];
  current?: string;
  allLabel: string;
}) {
  const items = [{ id: "", name: allLabel }, ...batches];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((b) => {
        const active = (current ?? "") === b.id;
        return (
          <Link
            key={b.id || "all"}
            href={b.id ? `${basePath}?batch=${b.id}` : basePath}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-full border px-4 text-sm",
              active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {b.name}
          </Link>
        );
      })}
    </div>
  );
}
