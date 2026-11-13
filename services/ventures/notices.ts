import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";

export type VentureNotice = {
  event: string;
  recipients: string[];
  title: string;
  body: string;
  path: string;
  email?: boolean;
  reviewReminder?: { trialId: string; round: number };
};

export async function notify(tx: Prisma.TransactionClient, notice: VentureNotice) {
  const rows = [...new Set(notice.recipients)].map((userId) => ({
    id: createHash("sha256").update(JSON.stringify([notice.event, userId])).digest("hex"),
    userId, title: notice.title, body: notice.body,
  }));
  if (!rows.length) return;
  await tx.notification.createMany({
    data: rows.map((row) => ({ ...row, type: "VENTURE_ACTIVITY", entityType: "VENTURE_LINK", entityId: notice.path })),
    skipDuplicates: true,
  });
  if (notice.email) {
    await tx.venture_email_outbox.createMany({
      data: rows.map((row) => ({
        ...row, path: notice.path, reviewTrialId: notice.reviewReminder?.trialId, reviewRound: notice.reviewReminder?.round,
      })),
      skipDuplicates: true,
    });
  }
}
