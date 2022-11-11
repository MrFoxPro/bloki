import { devices } from '@playwright/test'

const ci = process.env.CI === '1'

if (ci) console.log('Running tests in production mode')

/**
 * @type {import('@playwright/test').PlaywrightTestProject[]}
 */
const journeys = [
   {
      name: 'Desktop Chrome 16x9',
      use: {
         ...devices['Desktop Chrome'],
         viewport: {
            width: 1920,
            height: 1080,
         },
      },
   },
   {
      name: 'Desktop Chrome 4x3',
      use: {
         ...devices['Desktop Chrome'],
         viewport: {
            width: 1280,
            height: 1024,
         },
      },
   },
   {
      name: 'iPhone 12 Mini',
      use: {
         ...devices['iPhone 12 Mini'],
      },
   },
]

for (const p of journeys) {
   p.testDir = './journeys'
   p.use.video = {
      mode: 'on',
      size: p.use.viewport,
   }
}

/**
 * @type {import('@playwright/test').PlaywrightTestProject[]}
 */
const straight = [
   {
      name: 'Desktop Chrome',
      use: {
         ...devices['Desktop Chrome'],
      },
   },
]

for (const p of straight) {
   p.use.screenshot = 'on'
   p.testDir = './'
   p.testIgnore = /.*\/journeys\//
}

/**
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
export default {
   outputDir: '../dist/tests',
   webServer: {
      command: 'pnpm --dir ../ dev',
      port: 3000,
      reuseExistingServer: true,
   },
   timeout: ci ? 1000 * 60 * 1.5 : undefined,
   use: {
      baseURL: 'http://localhost:3000',
      locale: 'ru',
      headless: ci,
   },
   projects: straight.concat(journeys),
}
