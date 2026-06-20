import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const addSetup = () =>
	coreApp.acts.setAct({
		schema: "wareGroup",
		fn: addFn,
		actName: "add",
	preAct: [
		setTokens,
		setUser,
		grantAccess([{ roles: ["Manager", "Admin"] }]),
	],
		validator: addValidator(),
		validationRunType: "create",
	});
