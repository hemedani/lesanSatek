import { grantAccess, setTokens, setUser } from "@lib";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";
import { coreApp } from "../../../mod.ts";

export const countSetup = () =>
	coreApp.acts.setAct({
		schema: "organization",
		fn: countFn,
		actName: "count",
		preAct: [
			setTokens,
			setUser,
			grantAccess([{ roles: ["Manager", "Admin", "OrgHead", "UnitHead", "Employee", "Ordinary"] }]),
		],
		validator: countValidator(),
	});
