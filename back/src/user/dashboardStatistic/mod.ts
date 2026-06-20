import { coreApp } from "../../../mod.ts";
import { dashboardStatisticFn } from "./dashboardStatistic.fn.ts";
import { dashboardStatisticValidator } from "./dashboardStatistic.val.ts";

export const dashboardStatisticSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: dashboardStatisticFn,
    actName: "dashboardStatistic",
    validator: dashboardStatisticValidator(),
  });
