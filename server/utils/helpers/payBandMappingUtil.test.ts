import { addDays, subDays } from 'date-fns'
import { IepPay } from './incentiveLevelPayMappingUtil'
import { datePickerDateToIsoDate, formatIsoDate, isoDateToDatePickerDate } from '../datePickerUtils'
import { groupPayBand } from './payBandMappingUtil'

describe('Route Handlers - Create an activity - Helper', () => {
  describe('getPayGroupedByDisplayPay', () => {
    it('should group pay by incentive level with no pay description', async () => {
      const iepPay = [
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 2,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 150,
            },
          ],
        },
      ] as IepPay[]
      const result = groupPayBand(iepPay)

      expect(result).toEqual([
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 2,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 150,
            },
          ],
        },
      ])
    })

    it('should group pay by incentive level and display pay with a future pay change', async () => {
      const inFiveDays = formatIsoDate(addDays(new Date(), 5))
      const formattedDate = isoDateToDatePickerDate(inFiveDays)
      const iepPay = [
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 2,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 100,
              startDate: inFiveDays,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 3,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 1,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 1, displaySequence: 1 },
              rate: 100,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Standard',
              id: 4,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 2, displaySequence: 2 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Enhanced',
              id: 5,
              incentiveNomisCode: 'EHD',
              prisonPayBand: { id: 4, displaySequence: 4 },
              rate: 400,
            },
          ],
        },
      ] as IepPay[]
      const result = groupPayBand(iepPay)
      expect(result).toEqual([
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              allocationCount: 0,
              description: `, set to change to £1.00 from ${formattedDate}`,
              futurePaymentStart: datePickerDateToIsoDate(formattedDate),
              incentiveLevel: 'Basic',
              id: 3,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 1,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 1, displaySequence: 1 },
              rate: 100,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Standard',
              id: 4,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 2, displaySequence: 2 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Enhanced',
              id: 5,
              incentiveNomisCode: 'EHD',
              prisonPayBand: { id: 4, displaySequence: 4 },
              rate: 400,
            },
          ],
        },
      ])
    })

    it.skip('should group pay by incentive level and payBand with a past pay', async () => {
      const pastPayStartDate = formatIsoDate(subDays(new Date(), 5))
      const iepPay = [
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 2,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 100,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 3,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 200,
              startDate: pastPayStartDate,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 1,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 1, displaySequence: 1 },
              rate: 100,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Standard',
              id: 4,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 2, displaySequence: 2 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            {
              allocationCount: 0,
              incentiveLevel: 'Enhanced',
              id: 5,
              incentiveNomisCode: 'EHD',
              prisonPayBand: { id: 4, displaySequence: 4 },
              rate: 400,
            },
          ],
        },
      ] as IepPay[]
      const result = groupPayBand(iepPay)
      expect(result).toEqual([
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              allocationCount: 0,
              description: `set to change to £2.00 from ${pastPayStartDate}`,
              incentiveLevel: 'Basic',
              id: 2,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 100,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 1,
              description: `set to change to £2.15 from ${pastPayStartDate}`,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 1, displaySequence: 1 },
              rate: 100,
            },
            {
              allocationCount: 0,
              description: '',
              incentiveLevel: 'Standard',
              id: 4,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 2, displaySequence: 2 },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            {
              allocationCount: 0,
              description: '',
              incentiveLevel: 'Enhanced',
              id: 5,
              incentiveNomisCode: 'EHD',
              prisonPayBand: { id: 4, displaySequence: 4 },
              rate: 400,
            },
          ],
        },
      ])
    })
  })
})
