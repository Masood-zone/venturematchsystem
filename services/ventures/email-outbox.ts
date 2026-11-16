import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { emailService } from "@/services/email/email-service";
import { outstandingReviewers, reviewDeadline, trialState } from "@/lib/group-trial";

const maxAttempts = 5;

export async function deliverVentureEmails() {
  if (process.env.VENTURE_EMAIL_DELIVERY !== "true") return { delivered: 0, failed: 0 };
  return deliverReadyEmails({}, 50);
}

export async function deliverInvitationEmail(id: string) {
  await deliverReadyEmails({ id }, 1);
}

async function deliverReadyEmails(scope: Prisma.venture_email_outboxWhereInput, limit: number) {
  const now = new Date();
  const ready = {
    sentAt: null, failedAt: null, cancelledAt: null, availableAt: { lte: now },
    OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }],
  };
  const rows = await db.venture_email_outbox.findMany({
    where: { AND: [scope, ready] }, orderBy: [{ availableAt: "asc" }, { id: "asc" }], take: limit,
  });
  let delivered = 0;
  let failed = 0;
  for (const row of rows) {
    const token = randomUUID();
    const claimed = await db.venture_email_outbox.updateMany({
      where: { id: row.id, ...ready },
      data: { leaseToken: token, leaseUntil: new Date(Date.now() + 120_000), attempts: { increment: 1 } },
    });
    if (!claimed.count) continue;
    const key = { id: row.id, leaseToken: token };
    try {
      if (row.reviewTrialId) {
        const trial = await db.group_trial_state.findUnique({ where: { trialId: row.reviewTrialId }, select: { state: true } });
        const state = trial ? trialState.parse(trial.state) : null;
        if (!state || state.phase !== "REVIEW" || state.round !== row.reviewRound || new Date() >= reviewDeadline(state) ||
            !outstandingReviewers(state).some((member) => member.id === row.userId)) {
          await db.venture_email_outbox.updateMany({ where: key, data: { cancelledAt: new Date(), leaseToken: null, leaseUntil: null } });
          continue;
        }
      }
      const user = await db.user.findUnique({ where: { id: row.userId }, select: { name: true, email: true } });
      if (!user || !/^\/ventures(?:\/|$)/.test(row.path)) {
        await db.venture_email_outbox.updateMany({
          where: key, data: { failedAt: new Date(), failureCode: "INVALID_DESTINATION", leaseToken: null, leaseUntil: null },
        });
        failed++;
        continue;
      }
      await emailService.send({ kind: "venture-activity", userEmail: user.email, userName: user.name, title: row.title, body: row.body, path: row.path });
    } catch (error) {
      const smtpCode = typeof error === "object" && error && "responseCode" in error ? Number(error.responseCode) : 0;
      const permanent = smtpCode >= 500 || row.attempts + 1 >= maxAttempts;
      await db.venture_email_outbox.updateMany({
        where: key,
        data: {
          failedAt: permanent ? new Date() : null, failureCode: smtpCode ? `SMTP_${smtpCode}` : "DELIVERY_ERROR",
          leaseToken: null, leaseUntil: null, availableAt: new Date(Date.now() + 900_000 * 2 ** row.attempts),
        },
      });
      if (permanent) failed++;
      continue;
    }
    await db.venture_email_outbox.updateMany({
      where: key, data: { sentAt: new Date(), leaseToken: null, leaseUntil: null, failureCode: null },
    });
    delivered++;
  }
  return { delivered, failed };
}
