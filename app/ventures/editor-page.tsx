import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import StudentShell from "@/components/onboarding/student-shell";
import { getCurrentSession } from "@/services/auth/session";
import VentureEditor from "./editor";

export async function EditorPage({ id }: { id?: string }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const [profile, venture, sectors, skills, availability] = await Promise.all([
    db.student_profile.findUnique({ where: { userId: session.user.id }, select: { onboardingCompleted: true, student_availability: { select: { weeklyHoursBand: true } } } }),
    id ? db.venture.findFirst({ where: { id, ownerId: session.user.id, status: { in: ["DRAFT", "ACTIVE"] } }, include: { venture_capability_requirement: true } }) : null,
    db.venture_sector.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.capability.findMany({ where: { status: "ACTIVE", capability_family: { status: "ACTIVE" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.availability_option.findMany({ where: { active: true }, select: { id: true, label: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  if (id && !venture) notFound();

  return <StudentShell><main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-10"><VentureEditor id={id} owner={session.user.name} published={venture?.status === "ACTIVE"} sectors={sectors} skills={skills} availability={availability} initial={{
    title: venture?.name ?? "",
    problem: venture?.problem ?? "",
    targetUsers: venture?.targetUsers ?? "",
    sectorId: venture?.primarySectorId ?? "",
    contribution: venture?.recruitmentContribution ?? "",
    capabilityIds: venture?.venture_capability_requirement.map((item) => item.capabilityId) ?? [],
    stage: venture?.stage ?? "IDEA",
    weeklyHoursBand: venture?.weeklyHoursBand ?? profile.student_availability?.weeklyHoursBand ?? "",
    step: venture?.editorStep ?? 1,
  }} /></main></StudentShell>;
}
