import type { PanelId } from "../../src/lib/nav-config"

/**
 * Seeded personas from `back/http/e2e.json`.
 *
 * Every account shares the same password. Each persona pins the role that the
 * test authenticates as, because the app stores `activeRoleId` in a cookie and
 * several accounts hold more than one role (e.g. Ordinary + UnitHead).
 */
export type PersonaKey =
  | "manager"
  | "orgHead"
  | "unitHeadWarehouse"
  | "unitHeadFinance"
  | "storeHead"
  | "employee"

export interface Persona {
  key: PersonaKey
  label: string
  email: string
  password: string
  /** `role.name` used to select the active role from `user.roles`. */
  roleName: string
  /** Landing panel after login (mirrors `getDefaultPanel`). */
  homePath: string
  /** Panel id in `src/lib/nav-config.ts` — used by the route crawler. */
  panel: PanelId
}

export const PASSWORD = "password123"

export const PERSONAS: Record<PersonaKey, Persona> = {
  manager: {
    key: "manager",
    label: "مدیر سامانه",
    email: "admin@lesansatek.com",
    password: PASSWORD,
    roleName: "Manager",
    homePath: "/admin",
    panel: "admin",
  },
  orgHead: {
    key: "orgHead",
    label: "رئیس سازمان",
    email: "orghead.a@lesansatek.com",
    password: PASSWORD,
    roleName: "OrgHead",
    homePath: "/orghead",
    panel: "orghead",
  },
  unitHeadWarehouse: {
    key: "unitHeadWarehouse",
    label: "رئیس انبار مرکزی آلفا",
    email: "wh.a@lesansatek.com",
    password: PASSWORD,
    roleName: "UnitHead",
    homePath: "/unit-head",
    panel: "unit-head",
  },
  unitHeadFinance: {
    key: "unitHeadFinance",
    label: "رئیس واحد مالی آلفا",
    email: "fin.a@lesansatek.com",
    password: PASSWORD,
    roleName: "UnitHead",
    homePath: "/unit-head",
    panel: "unit-head",
  },
  storeHead: {
    key: "storeHead",
    label: "رئیس فروشگاه آلفا",
    email: "store.a@lesansatek.com",
    password: PASSWORD,
    roleName: "StoreHead",
    homePath: "/storehead",
    panel: "storehead",
  },
  employee: {
    key: "employee",
    label: "کارمند آزمایشگاه آلفا",
    email: "lab.a@lesansatek.com",
    password: PASSWORD,
    roleName: "Employee",
    homePath: "/requests",
    panel: "requests",
  },
}

export const ALL_PERSONA_KEYS = Object.keys(PERSONAS) as PersonaKey[]
