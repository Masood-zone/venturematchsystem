import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

// React.cache deduplicates within a server render, never across users/requests.
export const getCurrentSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
