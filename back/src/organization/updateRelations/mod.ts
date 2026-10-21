import { grantAccess, setTokens, setUser } from "@lib";
import { orgOfSelf } from "../../../utils/scopeResolvers.ts";
import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";

export const updateRelationsSetup = () =>
	coreApp.acts.setAct({
		schema: "organization",
		fn: updateRelationsFn,
		actName: "updateRelations",
		preAct: [
			setTokens,
			setUser,
			grantAccess([
				{ roles: ["Manager", "Admin"] },
				{ roles: ["OrgHead"], scope: orgOfSelf() },
			]),
		],
		validator: updateRelationsValidator(),
		validationRunType: "create",
	});
