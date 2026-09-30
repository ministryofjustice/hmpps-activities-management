import fs from 'fs'
import { execFileSync } from 'child_process'
import path from 'path'
import { expect, test } from '@playwright/test'
import screens from './screens.json'

const filesUnder = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(file) : [file]
  })

test('every application page has a classified smoke inventory entry', () => {
  execFileSync(process.execPath, ['e2e/scripts/screen-inventory.mjs', '--check'])
  const views = filesUnder('server/views/pages')
    .filter(file => file.endsWith('.njk') && !file.includes('/partials/'))
    .map(file => file.replace('server/views/', '').replace(/\.njk$/, ''))
  expect(screens.map(screen => screen.view).sort()).toEqual(views.sort())
  expect(new Set(screens.map(screen => screen.id)).size).toBe(screens.length)

  const specs = filesUnder('e2e/playwright/smoke')
    .filter(file => file.endsWith('.spec.ts'))
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n')
  const registeredAreas = [...specs.matchAll(/smokeArea\(\s*'([^']+)'/g)].map(match => match[1])
  screens.forEach(screen => {
    expect(screen.heading, screen.id).toMatch(/\S/)
    expect(screen.heading, screen.id).not.toBe('PENDING')
    expect(screen.route, screen.id).not.toBe('UNMAPPED')
    expect(['covered', 'excluded'], screen.id).toContain(screen.status)
    if (screen.status === 'covered') {
      expect(registeredAreas, screen.id).toContain(screen.area)
      expect(screen.route, screen.id).toMatch(/^\//)
    } else {
      expect('reason' in screen && screen.reason, screen.id).toBeTruthy()
    }
  })
})
