import { randomUUID } from 'crypto'
import { createClient } from 'redis'
import { JourneyData } from '../../../../server/@types/express'

// Seed only the local feature-test journey store; no application-only test routes are needed.
export const withJourney = async (data: JourneyData, run: (journeyId: string) => Promise<void>): Promise<void> => {
  const journeyId = randomUUID()
  const key = `systemToken:journey.USER1.${journeyId}`
  const client = createClient({ url: 'redis://127.0.0.1:6379', socket: { reconnectStrategy: false } })
  await client.connect()
  try {
    await client.set(key, JSON.stringify(data), { EX: 300 })
    await run(journeyId)
  } finally {
    await client.del(key)
    await client.quit()
  }
}

export const withSessionJourney = async (
  page: import('@playwright/test').Page,
  journeyId: string,
  data: Record<string, unknown>,
  run: () => Promise<void>,
): Promise<void> => {
  const cookie = (await page.context().cookies()).find(item => item.name === 'connect.sid')
  const sessionId = decodeURIComponent(cookie.value).slice(2).split('.')[0]
  const key = `sess:${sessionId}`
  const client = createClient({ url: 'redis://127.0.0.1:6379', socket: { reconnectStrategy: false } })
  await client.connect()
  try {
    const session = JSON.parse(String(await client.get(key)))
    session.sessionDataMap ??= {}
    session.sessionDataMap[journeyId] = { ...data, instanceUnixEpoch: Date.now() }
    await client.set(key, JSON.stringify(session), { KEEPTTL: true })
    await run()
  } finally {
    const session = JSON.parse(String(await client.get(key)))
    delete session.sessionDataMap[journeyId]
    await client.set(key, JSON.stringify(session), { KEEPTTL: true })
    await client.quit()
  }
}
