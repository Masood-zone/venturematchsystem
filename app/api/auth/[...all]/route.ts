import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/services/auth/auth";

// Node.js is the default. Cache Components disallows segment runtime overrides.
export const { GET, POST } = toNextJsHandler(auth);
