import { audit } from "../../runtime/dist/index.js";

export function requireRole(activeRoles, requiredRole) {
  const allowed = activeRoles.includes(requiredRole);
  audit("security", "role-check", { requiredRole, allowed });
  if (!allowed) {
    throw new Error(`Missing required role: ${requiredRole}`);
  }
}

export function evaluateRule(name, predicate) {
  const outcome = Boolean(predicate());
  audit("business-rule", name, { outcome });
  return outcome;
}
