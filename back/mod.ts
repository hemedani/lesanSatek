import { lesan, MongoClient } from "lesan";
import {
  accountingPeriods,
  accounts,
  budgetAllocations,
  budgetEncumbrances,
  budgetLines,
  cities,
  consumptions,
  costCenters,
  createInventoryIndex,
  createUserTextIndex,
  files,
  fiscalYears,
  goodsReceipts,
  inventories,
  journalEntries,
  journalEntryLines,
  manufacturers,
  organizations,
  paymentOrders,
  processes,
  processSteps,
  purchasingRequests,
  states,
  stepApprovals,
  stockMovements,
  stores,
  stuffs,
  tags,
  tenderOffers,
  tenders,
  units,
  users,
  wareClasses,
  wareGroups,
  wareModels,
  wares,
  wareTypes,
} from "@model";
import { functionsSetup } from "./src/mod.ts";

const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/";
const MONGO_DB = Deno.env.get("MONGO_DB") || "lesanSatek";
const APP_PORT = Deno.env.get("APP_PORT") || 1370;
const ENV = Deno.env.get("ENV") || "development";

export const coreApp = lesan();
const client = await new MongoClient(MONGO_URI).connect();
const db = client.db(MONGO_DB);
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
export const tender = tenders();
export const tenderOffer = tenderOffers();
export const inventory = inventories();
export const stockMovement = stockMovements();
export const goodsReceipt = goodsReceipts();
export const paymentOrder = paymentOrders();
export const fiscalYear = fiscalYears();
export const budgetLine = budgetLines();
export const budgetAllocation = budgetAllocations();
export const budgetEncumbrance = budgetEncumbrances();
export const consumption = consumptions();
export const account = accounts();
export const accountingPeriod = accountingPeriods();
export const costCenter = costCenters();
export const journalEntry = journalEntries();
export const journalEntryLine = journalEntryLines();

export const { setAct, setService, getAtcsWithServices } = coreApp.acts;

export const { selectStruct, getSchemas } = coreApp.schemas;

functionsSetup();

createInventoryIndex();
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
