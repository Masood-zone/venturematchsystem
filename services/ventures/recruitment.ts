import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { db } from "@/lib/db";
import {
  discoverableStudentWhere,
  publicProfileSelect,
} from "@/lib/onboarding";
import type {
  invitationInput,
  invitationAction,
} from "@/lib/venture-recruitment";
import { OnboardingError } from "@/services/onboarding/service";
import { lockVenture } from "./locking";
import { notify } from "./notices";

const invitationSelect = {
  id: true,
  ventureId: true,
  senderUserId: true,
  recipientUserId: true,
  status: true,
  proposedRole: true,
  message: true,
  expectedCommitment: true,
  createdAt: true,
  venture: { select: { name: true, status: true, ownerId: true } },
  user_venture_invitation_senderUserIdTouser: { select: { name: true } },
  user_venture_invitation_recipientUserIdTouser: { select: { name: true } },
} as const;

export async function recruitment(
  ventureId: string,
  userId: string,
  skillId?: string,
) {
  const venture = await db.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
    select: {
      id: true,
      name: true,
      status: true,
      weeklyHoursBand: true,
      venture_capability_requirement: {
        where: { confirmed: true },
        select: { capability: { select: { id: true, name: true } } },
      },
    },
  });
  if (!venture) return null;
  const needs = venture.venture_capability_requirement.map(
    ({ capability }) => capability,
  );
  const filter = needs.find((skill) => skill.id === skillId)?.id;
  const [students, invitations, availability] = await Promise.all([
    venture.status === "ACTIVE"
      ? db.student_profile.findMany({
          where: {
            ...discoverableStudentWhere,
            userId: { not: userId },
            user: {
              role: "student",
              venture_member: { none: { ventureId, status: "ACTIVE" } },
            },
            ...(filter
              ? { student_capability: { some: { capabilityId: filter } } }
              : {}),
          },
          select: publicProfileSelect,
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: 100,
        })
      : [],
    db.venture_invitation.findMany({
      where: { ventureId, senderUserId: userId },
      select: invitationSelect,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.availability_option.findMany({ select: { id: true, label: true } }),
  ]);
  return {
    venture,
    needs,
    students,
    invitations: await withUnreadDiscussion(invitations, userId),
    availability,
  };
}

async function withUnreadDiscussion<T extends { id: string }>(
  invitations: T[],
  userId: string,
) {
  if (!invitations.length) return [];
  const threads = await db.conversation.findMany({
    where: {
      contextType: "venture-invitation",
      contextId: { in: invitations.map(({ id }) => id) },
      conversation_participant: { some: { userId } },
    },
    select: {
      contextId: true,
      conversation_participant: {
        where: { userId },
        select: { lastReadAt: true },
      },
      message: {
        where: { senderUserId: { not: userId } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  const unread = new Set(
    threads
      .filter((thread) => {
        const latest = thread.message[0]?.createdAt;
        return (
          latest &&
          latest.getTime() >
            (thread.conversation_participant[0]?.lastReadAt?.getTime() ?? 0)
        );
      })
      .map((thread) => thread.contextId),
  );
  return invitations.map((invitation) => ({
    ...invitation,
    unread: unread.has(invitation.id),
  }));
}

export async function receivedInvitations(userId: string) {
  const invitations = await db.venture_invitation.findMany({
    where: { recipientUserId: userId },
    select: invitationSelect,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return withUnreadDiscussion(invitations, userId);
}

export async function invitationDetail(id: string, userId: string) {
  const invitation = await db.venture_invitation.findFirst({
    where: { id, OR: [{ recipientUserId: userId }, { senderUserId: userId }] },
    select: invitationSelect,
  });
  if (!invitation) return null;
  const thread = await db.conversation.findFirst({
    where: {
      contextType: "venture-invitation",
      contextId: id,
      conversation_participant: { some: { userId } },
    },
    select: {
      message: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
        select: { id: true, body: true, senderUserId: true, createdAt: true },
      },
    },
  });
  return { ...invitation, messages: thread?.message.reverse() ?? [] };
}

export function invite(
  ventureId: string,
  userId: string,
  input: z.infer<typeof invitationInput>,
) {
  return db.$transaction(
    async (tx) => {
      const venture = await lockVenture(tx, ventureId);
      if (venture.ownerId !== userId)
        throw new OnboardingError("Venture not found.", 404);
      if (venture.status !== "ACTIVE")
        throw new OnboardingError(
          "Publish this venture before inviting students.",
          409,
        );
      const candidate = await tx.student_profile.findFirst({
        where: {
          id: input.candidateId,
          ...discoverableStudentWhere,
          user: { role: "student" },
        },
        select: { userId: true },
      });
      if (!candidate || candidate.userId === userId)
        throw new OnboardingError("Candidate not found.", 404);
      const membership = await tx.venture_member.findUnique({
        where: { ventureId_userId: { ventureId, userId: candidate.userId } },
      });
      if (membership?.status === "ACTIVE")
        throw new OnboardingError("This student is already a member.", 409);
      const existing = await tx.venture_invitation.findFirst({
        where: {
          ventureId,
          recipientUserId: candidate.userId,
          status: { in: ["PENDING", "INTERESTED", "TRIAL_PROPOSED"] },
        },
        select: { id: true },
      });
      if (existing) return { ...existing, emailId: null };
      const id = randomUUID();
      await tx.venture_invitation.create({
        data: {
          id,
          ventureId,
          senderUserId: userId,
          recipientUserId: candidate.userId,
          proposedRole: input.role,
          message: input.message,
          expectedCommitment: input.commitment,
        },
      });
      const [emailId] = await notify(tx, {
        event: `invitation:${id}:sent`,
        recipients: [candidate.userId],
        email: true,
        title: "Venture invitation",
        body: `${venture.name} invited you to discuss a role.`,
        path: `/ventures/invitations/${id}`,
      });
      return { id, emailId };
    },
    { isolationLevel: "ReadCommitted" },
  );
}

export function actOnInvitation(
  id: string,
  userId: string,
  input: z.infer<typeof invitationAction>,
) {
  return db.$transaction(
    async (tx) => {
      const entry = await tx.venture_invitation.findFirst({
        where: {
          id,
          OR: [{ recipientUserId: userId }, { senderUserId: userId }],
        },
        select: { ventureId: true },
      });
      if (!entry) throw new OnboardingError("Invitation not found.", 404);
      const venture = await lockVenture(tx, entry.ventureId);
      const invitation = await tx.venture_invitation.findUniqueOrThrow({
        where: { id },
      });
      const isOwner =
        venture.ownerId === userId && invitation.senderUserId === userId;
      if (input.action === "message" || input.action === "read") {
        if (
          !["INTERESTED", "TRIAL_PROPOSED"].includes(invitation.status) ||
          (input.action === "message" && venture.status !== "ACTIVE") ||
          (!isOwner && userId !== invitation.recipientUserId)
        )
          throw new OnboardingError("This discussion is closed.", 409);
        const thread = await tx.conversation.findFirst({
          where: {
            contextType: "venture-invitation",
            contextId: id,
            conversation_participant: { some: { userId } },
          },
          select: { id: true },
        });
        if (!thread)
          throw new OnboardingError("This discussion is unavailable.", 409);
        if (input.action === "read") {
          const message = await tx.message.findFirst({
            where: { id: input.messageId, conversationId: thread.id },
            select: { createdAt: true },
          });
          if (!message) throw new OnboardingError("Message not found.", 404);
          await tx.conversation_participant.updateMany({
            where: {
              conversationId: thread.id,
              userId,
              OR: [
                { lastReadAt: null },
                { lastReadAt: { lt: message.createdAt } },
              ],
            },
            data: { lastReadAt: message.createdAt },
          });
          return { id };
        }
        const previous = await tx.message.findUnique({
          where: { id: input.id },
          select: { conversationId: true, senderUserId: true, body: true },
        });
        if (previous) {
          if (
            previous.conversationId !== thread.id ||
            previous.senderUserId !== userId ||
            previous.body !== input.text
          ) {
            throw new OnboardingError("Message ID is already in use.", 409);
          }
          return { id };
        }
        await tx.message.create({
          data: {
            id: input.id,
            conversationId: thread.id,
            senderUserId: userId,
            body: input.text,
          },
        });
        await tx.conversation_participant.updateMany({
          where: { conversationId: thread.id, userId },
          data: { lastReadAt: new Date() },
        });
        return { id };
      }
      if (
        input.action === "withdraw"
          ? !isOwner
          : invitation.recipientUserId !== userId
      ) {
        throw new OnboardingError("You cannot change this invitation.", 403);
      }
      const status =
        input.action === "withdraw"
          ? "WITHDRAWN"
          : input.action === "decline"
            ? "DECLINED"
            : "INTERESTED";
      if (invitation.status === status) return { id };
      if (
        invitation.status !== "PENDING" ||
        (status === "INTERESTED" && venture.status !== "ACTIVE")
      ) {
        throw new OnboardingError(
          "This invitation can no longer be changed.",
          409,
        );
      }
      await tx.venture_invitation.update({
        where: { id },
        data: { status, respondedAt: new Date() },
      });
      if (status === "INTERESTED") {
        await tx.conversation.create({
          data: {
            id: randomUUID(),
            ventureId: venture.id,
            contextType: "venture-invitation",
            contextId: id,
            conversation_participant: {
              create: [invitation.senderUserId, invitation.recipientUserId].map(
                (memberId) => ({ id: randomUUID(), userId: memberId }),
              ),
            },
          },
        });
      }
      await notify(tx, {
        event: `invitation:${id}:${status}`,
        recipients: [isOwner ? invitation.recipientUserId : venture.ownerId],
        email: true,
        title:
          status === "INTERESTED"
            ? "A candidate accepted your invitation"
            : status === "DECLINED"
              ? "Invitation declined"
              : "Invitation withdrawn",
        body: `Open the invitation for ${venture.name} to see its current status.`,
        path: `/ventures/invitations/${id}`,
      });
      return { id };
    },
    { isolationLevel: "ReadCommitted" },
  );
}
