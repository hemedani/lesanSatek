import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfSelf } from "../../../utils/scopeResolvers.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { coreApp } from "../../../mod.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "organization",
		fn: updateFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
			grantAccess([
				{ roles: ["Manager", "Admin"] },
				{ roles: ["OrgHead"], scope: orgOfSelf() },
			]),
		],
		validator: updateValidator(),
	});
