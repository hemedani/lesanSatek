import { assertEquals } from "@std/assert";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import { processMatchesReadScope } from "./readScope.ts";

const ORG_OWN = "507f1f77bcf86cd799439001";
const ORG_FOREIGN = "507f1f77bcf86cd799439002";

const role = (overrides: Partial<ActiveRole>): ActiveRole => ({
  roleId: "role-1",
  name: "OrgHead",
  ...overrides,
});

const ghost: ScopeUser = { isGhost: true, units: [] };

Deno.test("scoped Ghost roles do not bypass process read scopes", async () => {
  const activeRole = role({
    name: "OrgHead",
    scopeType: "organization",
    scopeId: ORG_OWN,
  });

  assertEquals(
    await processMatchesReadScope(activeRole, ghost, {
      organization: { _id: ORG_OWN },
    }),
    true,
  );
  assertEquals(
    await processMatchesReadScope(activeRole, ghost, {
      organization: { _id: ORG_FOREIGN },
    }),
    false,
  );
});
