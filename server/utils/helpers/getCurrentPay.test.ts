import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'

const prisoner = {
  prisonerNumber: 'G0995GW',
  currentIncentive: {
    level: { code: 'STD', description: 'Standard' },
    dateTime: '2017-01-12T12:08:12',
    nextReviewDate: '2018-01-12',
  },
} as unknown as Prisoner

const allocation = {
  prisonPayBand: {
    id: 312,
    description: 'Pay band 1 (Lowest)',
  },
}

const activity = {
  pay: [
    {
      id: 5579,
      incentiveNomisCode: 'ENH',
      incentiveLevel: 'Enhanced',
      prisonPayBand: {
        id: 312,
      },
      rate: 150,
      pieceRate: null,
      pieceRateItems: null,
      startDate: null,
    },
    {
      id: 5587,
      incentiveNomisCode: 'STD',
      incentiveLevel: 'Standard',
      prisonPayBand: {
        id: 312,
      },
      rate: 125,
      pieceRate: null,
      pieceRateItems: null,
      startDate: null,
    },
    {
      id: 5586,
      incentiveNomisCode: 'BAS',
      incentiveLevel: 'Basic',
      prisonPayBand: {
        id: 312,
      },
      rate: 125,
      pieceRate: null,
      pieceRateItems: null,
      startDate: null,
    },
    {
      id: 5581,
      incentiveNomisCode: 'STD',
      incentiveLevel: 'Standard',
      prisonPayBand: {
        id: 312,
      },
      rate: 100,
      pieceRate: null,
      pieceRateItems: null,
      startDate: null,
    },
  ],
}
describe('getCurrentPay', () => {
  it('finds the matching current pay when there are no updates', () => {
    // const result = getCurrentPay(activity, allocation, prisoner)
  })
  it('finds the matching current pay when there have been updates to pay', () => {
    // const result = getCurrentPay(activity, allocation, prisoner)
  })
})
