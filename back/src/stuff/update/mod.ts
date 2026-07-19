import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { checkStoreHeadAccess } from "../../../utils/checkStoreHeadAccess.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "stuff",
		fn: updateFn,
		actName: "update",
	preAct: [
		setTokens,
		setUser,
		grantAccess([
			{ roles: ["Manager", "Admin"] },
			{ roles: ["StoreHead"] },
		]),
		checkStoreHeadAccess("update"),
	],
		validator: updateValidator(),
		
	});
