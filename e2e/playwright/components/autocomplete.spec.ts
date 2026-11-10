import { readFileSync } from 'node:fs'
import { build } from 'esbuild'
import { expect, test } from '@playwright/test'
import { accessibleAutocompletePlugin } from '../../../esbuild/accessible-autocomplete.plugin'

const styles = readFileSync(require.resolve('accessible-autocomplete/dist/accessible-autocomplete.min.css'), 'utf8')
let script: string

test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `
        import AutoComplete from './frontend/components/autocomplete/autocomplete'
        new AutoComplete(document.querySelector('meta[name="autocompleteElements"]'))
      `,
      resolveDir: process.cwd(),
    },
    bundle: true,
    minify: true,
    write: false,
    platform: 'browser',
    plugins: [accessibleAutocompletePlugin()],
  })
  script = result.outputFiles[0].text
})

const devices = [
  {
    name: 'iPad with a desktop user agent',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
    platform: 'MacIntel',
    maxTouchPoints: 5,
    ios: true,
  },
  {
    name: 'iPad with a mobile user agent',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPad',
    maxTouchPoints: 5,
    ios: true,
  },
  {
    name: 'iPhone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    maxTouchPoints: 5,
    ios: true,
  },
  {
    name: 'Mac',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
    platform: 'MacIntel',
    maxTouchPoints: 0,
    ios: false,
  },
  {
    name: 'touchscreen Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32',
    maxTouchPoints: 10,
    ios: false,
  },
]

devices.forEach(device => {
  test.describe(`Autocomplete on ${device.name}`, () => {
    test.use({ userAgent: device.userAgent, hasTouch: device.maxTouchPoints > 0 })

    test.beforeEach(async ({ page }) => {
      await page.setContent(`
        <meta name="autocompleteElements" content="categoryCode">
        <form>
          <label for="categoryCode">Appointment</label>
          <select id="categoryCode" name="categoryCode">
            <option value="-" selected></option>
            <option value="CHAP">Chaplaincy</option>
            <option value="EDUC">Education</option>
          </select>
          <label for="customName">Add an optional custom name</label>
          <input id="customName" name="customName">
        </form>
      `)
      await page.evaluate(({ platform, maxTouchPoints }) => {
        Object.defineProperties(navigator, {
          platform: { value: platform, configurable: true },
          maxTouchPoints: { value: maxTouchPoints, configurable: true },
        })
      }, device)
      await page.addStyleTag({ content: styles })
      await page.addScriptTag({ content: script })
    })

    test('filters options, applies the appropriate blur behaviour and sets the form value', async ({ page }) => {
      const input = page.getByRole('combobox', { name: 'Appointment' })
      const listbox = page.getByRole('listbox')
      await expect(input).toHaveAttribute('aria-autocomplete', device.ios ? 'list' : 'both')
      await input.fill('Chap')
      await expect(listbox).toBeVisible()
      await expect(listbox.getByRole('option')).toHaveCount(1)

      // Simulate leaving the input, which must not dismiss the options on iOS.
      // VoiceOver swipes themselves still require testing on a physical iPad.
      await input.blur()
      if (device.ios) {
        await expect(listbox).toBeVisible()
        await expect(input).toHaveValue('Chap')
        await page.getByRole('option', { name: /^Chaplaincy/ }).tap()
      } else {
        await expect(listbox).toBeHidden()
        await input.fill('Chap')
        await page.getByRole('option', { name: 'Chaplaincy', exact: true }).click()
      }

      await expect(input).toHaveValue('Chaplaincy')
      await expect(listbox).toBeHidden()
      await expect(page.locator('select[name="categoryCode"]')).toHaveValue('CHAP')
      await page.getByLabel('Add an optional custom name').fill('Morning appointment')
    })

    test('supports selection with a keyboard and dismissal with Escape', async ({ page }) => {
      const input = page.getByRole('combobox', { name: 'Appointment' })
      await input.press('ArrowDown')
      await expect(page.getByRole('listbox')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('listbox')).toBeHidden()

      await input.fill('Educ')
      await input.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(input).toHaveValue('Education')
      await expect(page.locator('#categoryCode-select')).toHaveValue('EDUC')
    })
  })
})
