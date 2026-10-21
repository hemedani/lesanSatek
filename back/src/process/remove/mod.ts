import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfProcess } from "../../../utils/scopeResolvers.ts";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";
import { coreApp } from "../../../mod.ts";

export const removeSetup = () =>
	coreApp.acts.setAct({
		schema: "process",
		actName: "remove",
		fn: removeFn,
		preAct: [
			setTokens,
			setUser,
			grantAccess([
				{ roles: ["Manager", "Admin"] },
				{ roles: ["OrgHead"], scope: orgOfProcess() },
			]),
		],
		validator: removeValidator(),
	});
