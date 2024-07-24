import { startOfToday } from 'date-fns'
import { PrisonPayBand } from '../../@types/activitiesAPI/types'
import { formatDate, parseISODate, toMoney } from '../utils'
import { parseIsoDate } from '../datePickerUtils'
import { IepPay } from './incentiveLevelPayMappingUtil'

export type IepPayDisplay = {
  incentiveLevel: string
  pays: DisplayPay[]
}
export type DisplayPay = {
  allocationCount: number
  description?: string
  futurePaymentStart?: string
  id: number
  incentiveNomisCode: string
  incentiveLevel?: string
  prisonPayBand: PrisonPayBand
  rate?: number
  pieceRate?: number
  pieceRateItems?: number
  startDate?: string
}

export function groupPayBand(iepPay: IepPay[]): IepPayDisplay[] {
  const iepPayDisplays: IepPayDisplay[] = []

  iepPay.forEach(item => {
    const iepPayDisplay: IepPayDisplay = {
      incentiveLevel: item.incentiveLevel,
      pays: [],
    }

    // get distinct list of pay band IDs
    const uniquePayBandIds = item.pays
      .map(pay => pay.prisonPayBand.id)
      .filter((value, index, self) => self.indexOf(value) === index)

    uniquePayBandIds.forEach(i => {
      const pay = singleDisplayPayForPayBandId(item.pays, i)
      iepPayDisplay.pays.push(pay)
    })
    iepPayDisplays.push(iepPayDisplay)
  })

  return iepPayDisplays
}

function singleDisplayPayForPayBandId(input: DisplayPay[], payBandId: number): DisplayPay {
  const allForPayband = input.filter(a => a.prisonPayBand.id === payBandId)

  if (allForPayband.length === 1) {
    return allForPayband[0]
  }

  const possiblePayBands = input
    .filter(
      a => a.prisonPayBand.id === payBandId && (a.startDate == null || parseISODate(a.startDate) <= startOfToday()),
    )
    .sort(
      (a, b) =>
        (parseISODate(a.startDate) == null ? 0 : parseISODate(a.startDate).valueOf()) -
        (parseISODate(b.startDate) == null ? 0 : parseISODate(b.startDate).valueOf()),
    )

  const currentPayBand = possiblePayBands[possiblePayBands.length - 1]

  const futurePaybands = input
    .filter(a => a.prisonPayBand.id === payBandId && a.startDate != null && parseISODate(a.startDate) > startOfToday())
    .sort((a, b) => parseISODate(a.startDate).valueOf() - parseISODate(b.startDate).valueOf())

  if (futurePaybands.length > 0) {
    currentPayBand.description = `, set to change to ${toMoney(futurePaybands[0].rate)} from ${formatDate(parseIsoDate(futurePaybands[0].startDate))}`
    currentPayBand.futurePaymentStart = futurePaybands[0].startDate
  }
  return currentPayBand
}
