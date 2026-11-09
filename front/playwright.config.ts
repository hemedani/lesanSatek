import { defineConfig, devices } from "@playwright/test"

/**
 * LesanSatek front-end E2E configuration.
 *
 * Prerequisites:
 *   - MongoDB reachable at MONGO_URI (default mongodb://127.0.0.1:27017)
 *   - Backend on http://localhost:1370 (`cd back && deno task bc-dev`)
 *   - Frontend on http://localhost:3000 (`cd front && pnpm dev`)
 *
 * Playwright can boot the servers itself:
 *   E2E_START_BACKEND=1 pnpm test:e2e        # boots backend + frontend
 *   pnpm test:e2e                            # reuses whatever is already running
 *
 * Browser: bundled Chromium by default. If downloading browsers is not possible
 * in the current environment, use the locally installed Google Chrome:
 *   PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
 */

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const backendURL = process.env.E2E_BACKEND_URL ?? "http://localhost:1370"

/** `channel` switches Playwright to an already-installed browser binary. */
const channel = process.env.PLAYWRIGHT_CHANNEL || undefined

const startBackend = process.env.E2E_START_BACKEND === "1"

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",

  /* Next.js dev compiles routes on first hit, so keep the budget generous. */
  timeout: 120_000,
  expect: { timeout: 20_000 },

  /* The suite drives a single shared MongoDB — keep specs deterministic. */
  fullyParallel: false,
  workers: Number(process.env.E2E_WORKERS ?? 1),
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ["list"],
    ["html", { outputFolder: "./e2e/.report", open: "never" }],
  ],

  use: {
    baseURL,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    /* Video needs the ffmpeg binary — opt in with E2E_VIDEO=1. */
    video: process.env.E2E_VIDEO === "1" ? "retain-on-failure" : "off",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...(channel ? { channel } : {}) },
    },
    {
      name: "chromium",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        ...(channel ? { channel } : {}),
      },
    },
  ],

  webServer: [
    ...(startBackend
      ? [
          {
            command: "deno run --allow-all mod.ts",
            cwd: "../back",
            url: `${backendURL}/playground`,
            reuseExistingServer: true,
            timeout: 180_000,
            stdout: "pipe" as const,
            stderr: "pipe" as const,
          },
        ]
      : []),
    {
      command: "pnpm dev",
      url: baseURL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
})
