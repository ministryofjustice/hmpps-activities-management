import fs from 'node:fs'

const screens = JSON.parse(fs.readFileSync('e2e/playwright/smoke/screens.json', 'utf8'))
const escape = text => text.replaceAll('|', '\\|').replaceAll('\n', ' ')
const lines = [
  '# Application screen inventory',
  '',
  'Generated from `e2e/playwright/smoke/screens.json`. Edit that file and run `node e2e/scripts/screen-inventory.mjs`.',
  'Headings are the expected stable text in the page’s accessible level-one heading. Dynamic date suffixes are omitted.',
  'Each row represents a page template. Shared create/edit templates use one representative route and state;',
  'journey tests cover the other behaviours. Partials and layouts are checked through their owning screens.',
  '',
]
const areas = [...new Set(screens.map(screen => screen.area))].sort()
areas.forEach(area => {
  lines.push(`## ${area}`, '', '| Screen | Smoke route | Expected heading | Status |', '| --- | --- | --- | --- |')
  screens
    .filter(screen => screen.area === area)
    .forEach(screen => {
      lines.push(
        `| ${escape(screen.id)} | \`${escape(screen.route)}\` | ${escape(screen.heading)} | ${screen.status} |`,
      )
    })
  lines.push('')
})
const output = `${lines.join('\n')}\n`
const destination = 'e2e/SCREEN_INVENTORY.md'
if (process.argv.includes('--check')) {
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) {
    throw new Error('Screen inventory documentation is stale. Run node e2e/scripts/screen-inventory.mjs')
  }
} else {
  fs.writeFileSync(destination, output)
}
