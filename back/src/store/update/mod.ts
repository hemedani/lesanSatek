import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { storeOfSelf } from "../../../utils/scopeResolvers.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "store",
		fn: updateFn,
		actName: "update",
	preAct: [
		setTokens,
		setUser,
		grantAccess([
			{ roles: ["Manager", "Admin"] },
			{ roles: ["StoreHead"], scope: storeOfSelf() },
		]),
	],
		validator: updateValidator(),
		
	});
