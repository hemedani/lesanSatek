import { grantAccess, setTokens, setUser } from "@lib";
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
				{ roles: ["OrgHead"], getScope: (b) => ({
					scopeType: "organization",
					scopeId: b?.details?.set?.organizationId || b?.details?.set?._id,
				})},
			]),
		],
		validator: removeValidator(),
	});
