import { chromium } from 'playwright'

const baseUrl = process.env.DSH_URL || 'http://127.0.0.1:3080/'
const timeout = Number(process.env.DSH_SMOKE_TIMEOUT || 15000)
const launchOptions = { headless: process.env.DSH_HEADFUL !== '1' }
if (process.env.DSH_BROWSER_CHANNEL) launchOptions.channel = process.env.DSH_BROWSER_CHANNEL

let browser
let page
const pageErrors = []

async function waitForState() {
  await page.waitForTimeout(80)
}

async function expandedValues(panel) {
  return panel.locator('.tlnav-turn').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-expanded')))
}

try {
  browser = await chromium.launch(launchOptions)
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout })
  if (process.env.DSH_SESSION_TEXT) {
    await page.waitForTimeout(1200)
    if (process.env.DSH_WORKSPACE_TEXT) {
      const workspace = page.locator('[role="treeitem"]').filter({ hasText: process.env.DSH_WORKSPACE_TEXT }).first()
      await workspace.waitFor({ state: 'visible', timeout })
      await workspace.click({ timeout })
      await page.waitForTimeout(500)
    }
    const session = page.locator('[role="treeitem"]').filter({ hasText: process.env.DSH_SESSION_TEXT }).first()
    await session.waitFor({ state: 'visible', timeout })
    await session.click({ timeout })
    await page.waitForTimeout(1000)
  }
  const trigger = page.locator('.tlnav-trigger')
  await trigger.waitFor({ state: 'visible', timeout })
  await trigger.hover()

  const panel = page.locator('.tlnav-panel[data-open="true"]')
  await page.waitForFunction(() => document.querySelector('.tlnav-panel')?.dataset.open === 'true', null, { timeout })
  const panelBox = await panel.boundingBox()
  if (panelBox) await page.mouse.move(panelBox.x + 20, panelBox.y + 100)
  await panel.waitFor({ state: 'visible', timeout })

  const headerLayout = await panel.locator('.tlnav-header').evaluate((header) => {
    const headerBox = header.getBoundingClientRect()
    const buttons = [...header.querySelectorAll('button')].map((button) => {
      const box = button.getBoundingClientRect()
      return { left: box.left, right: box.right }
    })
    return { left: headerBox.left, right: headerBox.right, width: headerBox.width, buttonCount: buttons.length, buttons }
  })
  if (headerLayout.width < 256 || headerLayout.buttonCount !== 6 || headerLayout.buttons.some((button) => button.left < headerLayout.left || button.right > headerLayout.right)) {
    throw new Error('Header controls do not fit inside the minimum panel width.')
  }

  const turns = panel.locator('.tlnav-turn')
  const turnCount = await turns.count()
  if (!turnCount) throw new Error('No turn groups found. Open a non-empty Harness conversation before running the smoke test.')

  const languageToggle = panel.locator('.tlnav-language')
  if (await languageToggle.count() !== 1) throw new Error('Language switcher is missing.')
  const beforeLanguage = await languageToggle.getAttribute('data-language')
  await languageToggle.click()
  await waitForState()
  const afterLanguage = await languageToggle.getAttribute('data-language')
  if (!afterLanguage || afterLanguage === beforeLanguage) throw new Error('Language switcher did not change the active language.')
  const expectedTurnLabel = afterLanguage === 'zh' ? '跳转到回合' : 'Jump to a turn'
  if (await panel.locator('.tlnav-turn-select').getAttribute('aria-label') !== expectedTurnLabel) {
    throw new Error(`Language switcher did not update the turn selector to ${expectedTurnLabel}.`)
  }
  await languageToggle.click()
  await waitForState()
  if (await languageToggle.getAttribute('data-language') !== beforeLanguage) throw new Error('Language switcher did not toggle back.')

  const turnJump = panel.locator('.tlnav-turn-jump')
  const turnSelect = turnJump.locator('.tlnav-turn-select')
  if (await turnJump.count() !== 1 || await turnSelect.count() !== 1) throw new Error('Quick turn navigation is missing.')
  if (await turnJump.locator('[data-action="previous-turn"]').count() !== 1 || await turnJump.locator('[data-action="next-turn"]').count() !== 1) {
    throw new Error('Previous/next turn controls are missing.')
  }
  if (await turnSelect.locator('option').count() < 2) throw new Error('Quick turn selector has no turn options.')

  const initiallyCollapsed = await expandedValues(panel)
  if (initiallyCollapsed.some((value) => value !== 'false')) {
    throw new Error(`Expected all turns to start collapsed, received: ${initiallyCollapsed.join(', ')}`)
  }

  const expandAll = panel.locator('[data-action="expand-all"]')
  const collapseAll = panel.locator('[data-action="collapse-all"]')
  if (await expandAll.count() !== 1 || await collapseAll.count() !== 1) {
    throw new Error('Expand all / Collapse all controls are missing.')
  }
  await expandAll.click()
  await waitForState()
  if ((await expandedValues(panel)).some((value) => value !== 'true')) {
    throw new Error('Expand all did not open every turn.')
  }
  await collapseAll.click()
  await waitForState()
  if ((await expandedValues(panel)).some((value) => value !== 'false')) {
    throw new Error('Collapse all did not close every turn.')
  }
  await expandAll.click()
  await waitForState()

  const star = panel.locator('.tlnav-star-button').first()
  if (await star.count() !== 1) throw new Error('No bookmark star button found.')
  const beforeBookmark = await star.getAttribute('aria-pressed')
  await star.click()
  await waitForState()
  const afterBookmark = await star.getAttribute('aria-pressed')
  if (afterBookmark === beforeBookmark) throw new Error('Bookmark star did not toggle.')
  await star.click()
  await waitForState()
  if (await star.getAttribute('aria-pressed') !== beforeBookmark) throw new Error('Bookmark star did not toggle back.')

  for (const action of ['jump-earliest', 'jump-latest']) {
    const button = panel.locator(`[data-action="${action}"]`)
    if (await button.count() !== 1 || !(await button.getAttribute('data-tooltip'))) {
      throw new Error(`${action} button or its visible tooltip is missing.`)
    }
    await button.click()
    await waitForState()
  }

  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('.tlnav-panel[data-open="true"]'), null, { timeout })
  if (pageErrors.length) throw new Error(`Harness page errors: ${pageErrors.join(' | ')}`)

  console.log(`UI smoke passed: ${turnCount} turn group(s), bookmark toggle, bulk collapse, boundary jumps, and Escape close.`)
} catch (error) {
  console.error(`UI smoke failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
}
