import { grantAccess, setTokens, setUser } from "@lib";
import { orgFromSet } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
	coreApp.acts.setAct({
		schema: "process",
		fn: addFn,
		actName: "add",
		preAct: [
			setTokens,
			setUser,
			grantAccess([
				{ roles: ["Manager", "Admin"] },
				{ roles: ["OrgHead"], scope: orgFromSet("organizationId") },
			]),
		],
		validator: addValidator(),
		validationRunType: "create",
	});
