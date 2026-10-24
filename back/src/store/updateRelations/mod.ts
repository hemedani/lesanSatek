import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { storeOfSelf } from "../../../utils/scopeResolvers.ts";

export const updateRelationsSetup = () =>
	coreApp.acts.setAct({
		schema: "store",
		fn: updateRelationsFn,
		actName: "updateRelations",
	preAct: [
		setTokens,
		setUser,
		grantAccess([
			{ roles: ["Manager", "Admin"] },
			{ roles: ["StoreHead"], scope: storeOfSelf() },
		]),
	],
		validator: updateRelationsValidator(),
		
	});
