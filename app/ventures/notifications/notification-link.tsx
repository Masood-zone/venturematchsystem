"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { linkClass } from "@/components/ventures/workspace-styles";

export function NotificationLink({ id, href, unread }: { id: string; href: string; unread: boolean }) {
  const router = useRouter();
  return <Link href={href} className={linkClass} onNavigate={unread ? (event) => {
    event.preventDefault();
    void fetch("/api/me/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), keepalive: true,
    }).finally(() => router.push(href));
  } : undefined}>Open update</Link>;
}
