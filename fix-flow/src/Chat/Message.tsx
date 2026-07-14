import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Message({
  senderName,
  isOwn,
  children,
}: {
  senderName: string;
  isOwn: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex flex-col text-sm",
        isOwn ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div className="mb-1 text-sm font-medium">{senderName}</div>
      <p
        className={cn(
          "rounded-xl bg-muted px-3 py-2",
          isOwn ? "rounded-tr-none" : "rounded-tl-none",
        )}
      >
        {children}
      </p>
    </li>
  );
}
