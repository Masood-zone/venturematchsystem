import { registerHooks } from "node:module";

// The worker runs on the server and uses the ordinary React DOM renderer for email.
// Resolve only the server-only marker with the RSC condition.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return nextResolve(specifier, { ...context, conditions: [...context.conditions, "react-server"] });
    }
    return nextResolve(specifier, context);
  },
});
