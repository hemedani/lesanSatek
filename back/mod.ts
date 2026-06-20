import { lesan, MongoClient } from "lesan";
import {
  users,
  files,
  tags,
  organizations,
  units,
  processes,
  processSteps,
  purchasingRequests,
  states,
  cities,
  manufacturers,
  wareTypes,
  wareClasses,
  wareGroups,
  wareModels,
  wares,
  stuffs,
  stores,
  stepApprovals,
  createUserTextIndex,
} from "@model";
import { functionsSetup } from "./src/mod.ts";

const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/";
const APP_PORT = Deno.env.get("APP_PORT") || 1405;
const ENV = Deno.env.get("ENV") || "development";

export const coreApp = lesan();
const client = await new MongoClient(MONGO_URI).connect();
const db = client.db("lesanSatek");
coreApp.odm.setDb(db);

export const user = users();
export const file = files();
export const tag = tags();
export const organization = organizations();
export const unit = units();
export const process = processes();
export const processStep = processSteps();
export const purchasingRequest = purchasingRequests();
export const state = states();
export const city = cities();
export const manufacturer = manufacturers();
export const wareType = wareTypes();
export const wareClass = wareClasses();
export const wareGroup = wareGroups();
export const wareModel = wareModels();
export const ware = wares();
export const stuff = stuffs();
export const store = stores();
export const stepApproval = stepApprovals();

export const { setAct, setService, getAtcsWithServices } = coreApp.acts;

export const { selectStruct, getSchemas } = coreApp.schemas;

functionsSetup();

createUserTextIndex();

coreApp.runServer({
  port: Number(APP_PORT),
  typeGeneration: true,
  playground: ENV === "development" ? true : false,
  staticPath: ["/uploads"],
  cors: [
    "http://localhost:3000",
    "http://localhost:3005",
  ],
});
