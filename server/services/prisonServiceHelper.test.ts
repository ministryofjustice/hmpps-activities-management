import { addDays, formatISO } from 'date-fns'
import * as prisonServiceHelper from './prisonServiceHelper'
import transfers from './fixtures/transfers_1.json'

describe('PrisonServiceHelper', () => {
  describe('getScheduledTransfers', () => {
    it('Success match G10001', async () => {
      const events = prisonServiceHelper.getScheduledTransfers(transfers, 'G10001', '2022-08-01')
      expect(events.length).toEqual(1)
      expect(events[0].eventId).toEqual(10001)
      expect(events[0].eventDescription).toEqual('Transfer scheduled')
      expect(events[0].expired).toBe(undefined)
      expect(events[0].cancelled).toBe(undefined)
      expect(events[0].complete).toBe(true)
      expect(events[0].scheduled).toBe(undefined)
      expect(events[0].unCheckedStatus).toBe(undefined)
    })
    it('Success match G10002', async () => {
      const events = prisonServiceHelper.getScheduledTransfers(transfers, 'G10002', '2022-08-01')
      expect(events.length).toEqual(1)
      expect(events[0].eventId).toEqual(10002)
      expect(events[0].eventDescription).toEqual('Transfer scheduled')
      expect(events[0].expired).toBe(undefined)
      expect(events[0].cancelled).toBe(undefined)
      expect(events[0].complete).toBe(undefined)
      expect(events[0].scheduled).toBe(true)
      expect(events[0].unCheckedStatus).toBe(undefined)
    })
    it('Only show transfers if query is for today (or before today) - tomorrow', async () => {
      const tomorrow = addDays(new Date(), 1)
      const isoDateTomorrow = formatISO(tomorrow, { representation: 'date' })
      const events = prisonServiceHelper.getScheduledTransfers(transfers, 'G10002', isoDateTomorrow)
      expect(events.length).toEqual(0)
    })
    it('Only show transfers if query is for today (or before today) - today', async () => {
      const isoDateToday = formatISO(new Date(), { representation: 'date' })
      const events = prisonServiceHelper.getScheduledTransfers(transfers, 'G10002', isoDateToday)
      expect(events.length).toEqual(1)
    })
  })
})
