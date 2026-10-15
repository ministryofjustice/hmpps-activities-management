import { randomUUID } from 'crypto'
import { createClient } from 'redis'
import { JourneyData } from '../../../../server/@types/express'

// Seed only the local feature-test journey store; no application-only test routes are needed.
// eslint-disable-next-line import/prefer-default-export
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
