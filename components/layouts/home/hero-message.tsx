"use client";

import { useAccountEntry } from "@/hooks/auth/use-account-entry";

const publicMessage = {
  title: "Your next venture starts with the people around you.",
  description: "Connect with students across USTED who bring different skills. Find a team to contribute to, or bring your own idea and meet people to build it with.",
};

const messages = {
  founder: {
    title: "Your venture is live. What’s next?",
    description: "Manage your venture, review applications, and find students with the skills your team needs.",
  },
  builder: {
    title: "Give your idea a place to grow.",
    description: "Develop your idea in My ventures. Publish it when you’re ready to find collaborators.",
  },
  "team-seeker": {
    title: "Find a team that needs your skills.",
    description: "Explore student ventures, see where your skills fit, and apply to the teams you’d like to join.",
  },
  setup: publicMessage,
  student: publicMessage,
};

export default function HeroMessage() {
  const { status } = useAccountEntry();
  const { title, description } = status ? messages[status] : publicMessage;

  return (
    <>
      <h1 className="max-w-xl text-balance font-sans text-[32px] leading-[1.17] font-bold tracking-tight text-primary sm:text-[48px]">
        {title}
      </h1>
      <p className="max-w-lg font-sans text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
    </>
  );
}
