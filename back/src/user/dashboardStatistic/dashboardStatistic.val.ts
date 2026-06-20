import { enums, object, optional } from "lesan";

export const dashboardStatisticValidator = () => {
  return object({
    set: object({}),
    get: object({
      files: optional(enums([0, 1])),
      organizations: optional(enums([0, 1])),
      processes: optional(enums([0, 1])),
      processSteps: optional(enums([0, 1])),
      purchasingRequests: optional(enums([0, 1])),
      tags: optional(enums([0, 1])),
      units: optional(enums([0, 1])),
      users: optional(enums([0, 1])),
      userByLevel: optional(enums([0, 1])),
    }),
  });
};
