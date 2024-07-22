import { addDays, subDays } from 'date-fns'
import { IepPay } from './incentiveLevelPayMappingUtil'
import { datePickerDateToIsoDate, formatIsoDate, isoDateToDatePickerDate } from '../datePickerUtils'
import { groupPayBand } from './payBandMappingUtil'
import { formatDate } from '../utils'

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
      const inFiveDays = addDays(new Date(), 5)
      const inFiveDaysStr = formatIsoDate(inFiveDays)
      const formattedDatePicker = isoDateToDatePickerDate(inFiveDaysStr)
      const messageDate = formatDate(inFiveDays)

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
              startDate: inFiveDaysStr,
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
              description: `, set to change to £1.00 from ${messageDate}`,
              futurePaymentStart: datePickerDateToIsoDate(formattedDatePicker),
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

    it('should group pay by incentive level and payBand with a past pay', async () => {
      const pastPayStartDateStr = formatIsoDate(subDays(new Date(), 5))
      const futurePayStartDate = addDays(new Date(), 5)
      const futurePayStartDateStr = formatIsoDate(futurePayStartDate)
      const futureMessageDate = formatDate(futurePayStartDate)

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
              startDate: pastPayStartDateStr,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Basic',
              id: 3,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 211,
              startDate: futurePayStartDateStr,
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
              prisonPayBand: { id: 2, displaySequence: 1 },
              rate: 100,
            },
            {
              allocationCount: 0,
              incentiveLevel: 'Standard',
              id: 4,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 2, displaySequence: 2 },
              rate: 200,
              startDate: futurePayStartDateStr,
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
              description: `, set to change to £2.11 from ${futureMessageDate}`,
              incentiveLevel: 'Basic',
              id: 3,
              incentiveNomisCode: 'BAS',
              prisonPayBand: { id: 3, displaySequence: 3 },
              rate: 200,
              startDate: pastPayStartDateStr,
              futurePaymentStart: futurePayStartDateStr,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              allocationCount: 1,
              description: `, set to change to £2.00 from ${futureMessageDate}`,
              incentiveLevel: 'Standard',
              id: 3,
              incentiveNomisCode: 'STD',
              prisonPayBand: { id: 2, displaySequence: 1 },
              futurePaymentStart: futurePayStartDateStr,
              rate: 100,
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
  })
})
