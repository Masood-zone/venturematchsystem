"use client";

export default function ProfileIntroductions({ contributionIntro, teamGoals, onContributionChange, onGoalsChange }: {
  contributionIntro: string; teamGoals: string;
  onContributionChange: (value: string) => void; onGoalsChange: (value: string) => void;
}) {
  return <div className="space-y-5">
    <label className="onboarding-label">What I can contribute <span className="font-normal text-muted-foreground">(optional)</span>
      <textarea className="onboarding-input mt-2 resize-y" rows={4} maxLength={1000} value={contributionIntro} onChange={(event) => onContributionChange(event.target.value)} placeholder="Tell a team how you could help and what you enjoy doing." />
    </label>
    <label className="onboarding-label">What I’m looking for in a team <span className="font-normal text-muted-foreground">(optional)</span>
      <textarea className="onboarding-input mt-2 resize-y" rows={4} maxLength={1000} value={teamGoals} onChange={(event) => onGoalsChange(event.target.value)} placeholder="Describe the kind of project, people or experience you’re looking for." />
    </label>
    <p className="text-xs leading-6 text-muted-foreground">These introductions are shared with a venture owner when you apply. They are not included in the student directory.</p>
  </div>;
}
