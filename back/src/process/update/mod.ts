import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcess } from "../../../utils/scopeResolvers.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { coreApp } from "../../../mod.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "process",
		fn: updateFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
			grantAccess([
				{ roles: ["Manager", "Admin"] },
				{ roles: ["OrgHead"], scope: orgOfProcess() },
			]),
		],
		validator: updateValidator(),
	});
