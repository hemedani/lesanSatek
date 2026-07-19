import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getFn } from "./get.fn.ts";
import { getValidator } from "./get.val.ts";

export const getSetup = () =>
	coreApp.acts.setAct({
		schema: "wareModel",
		fn: getFn,
		actName: "get",
		preAct: [
			setTokens,
			setUser,
			grantAccess([{ roles: ["Manager", "Admin", "OrgHead", "UnitHead", "StoreHead", "Employee", "Ordinary"] }]),
		],
		validator: getValidator(),
		
	});
