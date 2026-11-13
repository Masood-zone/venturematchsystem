import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/services/auth/session";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { Workspace, panelClass } from "@/components/ventures/workspace";
import { NotificationLink } from "./notification-link";

async function Notifications() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const notices = await db.notification.findMany({
    where: { userId: session.user.id, entityType: "VENTURE_LINK" },
    select: { id: true, title: true, body: true, readAt: true, entityId: true, createdAt: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
  });

  return <Workspace title="Notifications" back={{ label: "Back to My Ventures", href: "/ventures" }}>
    <section className={panelClass}>
      {notices.length ? <ul className="divide-y">{notices.map((notice) => <li key={notice.id} className="space-y-1 py-4">
        <h2 className="font-semibold text-primary">{notice.title}{!notice.readAt && <span className="ml-2 rounded-full bg-accent px-2 py-1 text-xs">Unread</span>}</h2>
        <p>{notice.body}</p>
        <time className="block text-xs text-muted-foreground" dateTime={notice.createdAt.toISOString()}>{notice.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC</time>
        {notice.entityId && /^\/ventures(?:\/|$)/.test(notice.entityId) && <NotificationLink id={notice.id} href={notice.entityId} unread={!notice.readAt} />}
      </li>)}</ul> : <p>No notifications yet.</p>}
    </section>
  </Workspace>;
}

export default function NotificationsPage() {
  return <Suspense fallback={<DashboardLoading />}><Notifications /></Suspense>;
}
