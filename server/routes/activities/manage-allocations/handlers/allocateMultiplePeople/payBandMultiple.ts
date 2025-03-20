import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import { startOfToday } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import { payBandDetail } from '../../../../../utils/helpers/allocationUtil'
import { formatDate, parseISODate, toMoney } from '../../../../../utils/utils'

export class PayBand {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  payBand: number
}

export default class PayBandMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const allPayBands: payBandDetail[] = await this.getActivityPayRates(req, res)
    const payBands: payBandDetail[] = payBandWithDescription(allPayBands)

    // need to get the payBands available per prisoner
    // if there is only one payband for that prisoner, set it for them
    // if all prisoners have had their payband set automatically, redirect the page without rendering
    // if any paybands need manually picking, display them as radios

    res.render('pages/activities/manage-allocations/allocateMultiplePeople/payBandMultiple', {
      payBands,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // const { payBand } = req.body
    // const { user } = res.locals
    // const { allocationId } = req.params

    // if (req.params.mode === 'edit') {
    //   const allocation = {
    //     payBandId: +payBand,
    //   } as AllocationUpdateRequest

    //   await this.activitiesService.updateAllocation(+allocationId, allocation, user)

    //   const successMessage = `You've updated the pay rate for this allocation`
    //   return res.redirectWithSuccess(
    //     `/activities/allocations/view/${allocationId}`,
    //     'Allocation updated',
    //     successMessage,
    //   )
    // }

    // const payBandDetails: payBandDetail = (await this.getActivityPayRates(req, res)).find(b => b.bandId === payBand)

    // req.session.allocateJourney.inmate.payBand = {
    //   id: payBandDetails.bandId,
    //   alias: payBandDetails.bandAlias,
    //   rate: payBandDetails.rate,
    // }

    return res.redirect('check-and-confirm-multiple')
  }

  private async getActivityPayRates(req: Request, res: Response): Promise<payBandDetail[]> {
    const { inmates, activity } = req.session.allocateJourney

    const inmatesIncentiveLevels = Array.from(new Set(inmates.map(inmate => inmate.incentiveLevel)))
    const payRates = (await this.activitiesService.getActivity(activity.activityId, res.locals.user))?.pay

    return _.sortBy(payRates, 'prisonPayBand.displaySequence')
      .filter(pay => !pay.incentiveLevel || inmatesIncentiveLevels.includes(pay.incentiveLevel))
      .map(pay => ({
        bandId: pay.prisonPayBand.id,
        bandAlias: pay.prisonPayBand.alias,
        rate: pay.rate,
        startDate: pay.startDate,
      }))
  }
}

export function payBandWithDescription(originalPayBands: payBandDetail[]): payBandDetail[] {
  const formattedPayBands: payBandDetail[] = []
  const uniquePayBandIds = [...new Set(originalPayBands.map(pay => pay.bandId))]
  uniquePayBandIds.forEach(i => {
    const payBand = singlePayBandForPayBandId(originalPayBands, i)
    formattedPayBands.push(payBand)
  })
  return formattedPayBands
}

function singlePayBandForPayBandId(originalPayBands: payBandDetail[], bandId: number): payBandDetail {
  const possiblePayBands: payBandDetail[] = originalPayBands
    .filter(a => a.bandId === bandId && (a.startDate == null || parseISODate(a.startDate) <= startOfToday()))
    .sort(
      (a, b) =>
        (parseISODate(a.startDate) == null ? 0 : parseISODate(a.startDate).valueOf()) -
        (parseISODate(b.startDate) == null ? 0 : parseISODate(b.startDate).valueOf()),
    )

  const currentPayBand = possiblePayBands[possiblePayBands.length - 1]

  const futurePaybands: payBandDetail[] = originalPayBands
    .filter(a => a.bandId === bandId && a.startDate != null && parseISODate(a.startDate) > startOfToday())
    .sort((a, b) => parseISODate(a.startDate).valueOf() - parseISODate(b.startDate).valueOf())

  if (futurePaybands.length > 0) {
    currentPayBand.description = `, set to change to ${toMoney(futurePaybands[0].rate)} from ${formatDate(parseISODate(futurePaybands[0].startDate))}`
  }

  return currentPayBand
}
