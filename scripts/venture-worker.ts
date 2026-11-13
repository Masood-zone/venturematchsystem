import "dotenv/config";
import { setTimeout as delay } from "node:timers/promises";
import { db } from "@/lib/db";
import { advanceTrial } from "@/services/ventures/trials";
import { deliverVentureEmails } from "@/services/ventures/email-outbox";

async function runPass() {
  const trials = await db.group_trial_state.findMany({
    where: { nextTransitionAt: { lte: new Date() } },
    orderBy: { nextTransitionAt: "asc" },
    select: { trialId: true }, take: 100,
  });
  let transitionErrors = 0;
  for (const trial of trials) {
    try {
      await advanceTrial(trial.trialId);
    } catch {
      transitionErrors++;
      console.error("Trial deadline transition failed", trial.trialId);
    }
  }
  const delivery = await deliverVentureEmails();
  console.log({ trialsChecked: trials.length, transitionErrors, ...delivery });
  return transitionErrors + delivery.failed;
}

async function run() {
  if (!process.argv.includes("--watch")) {
    if (await runPass()) process.exitCode = 1;
    return;
  }

  const stop = new AbortController();
  const stopWorker = () => stop.abort();
  process.once("SIGINT", stopWorker);
  process.once("SIGTERM", stopWorker);
  try {
    while (!stop.signal.aborted) {
      const start = Date.now();
      try {
        await runPass();
      } catch {
        console.error("Venture worker pass could not finish.");
      }
      try {
        await delay(Math.max(0, start + 15 * 60_000 - Date.now()), undefined, { signal: stop.signal });
      } catch (error) {
        if (!stop.signal.aborted) throw error;
      }
    }
  } finally {
    process.off("SIGINT", stopWorker);
    process.off("SIGTERM", stopWorker);
  }
}

run().catch(() => {
  console.error("Venture worker could not finish.");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
