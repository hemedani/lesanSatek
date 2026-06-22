import { coreApp } from "../mod.ts";
import {
  boolean,
  coerce,
  date,
  defaulted,
  enums,
  optional,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";

export const fiscalYear_status_array = ["open", "closed"];
export const fiscalYear_status_emums = enums(fiscalYear_status_array);

export const fiscalYear_pure = {
  name: string(),
  startDate: coerce(date(), string(), (value) => new Date(value)),
  endDate: coerce(date(), string(), (value) => new Date(value)),
  isActive: defaulted(boolean(), false),
  status: defaulted(
    coerce(
      fiscalYear_status_emums,
      string(),
      (value) => value as typeof fiscalYear_status_array[number],
    ),
    "open",
  ),
  ...createUpdateAt,
};

export const fiscalYear_relations = {};

export const fiscalYears = () =>
  coreApp.odm.newModel("fiscalYear", fiscalYear_pure, fiscalYear_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
      },
    },
  });
