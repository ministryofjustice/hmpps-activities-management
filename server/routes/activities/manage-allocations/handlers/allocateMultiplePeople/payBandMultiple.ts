import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import { startOfToday } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import { addPayBand, payBandDetail } from '../../../../../utils/helpers/allocationUtil'
import { formatDate, parseISODate, toMoney } from '../../../../../utils/utils'

export class PayBand {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  payBand: number
}

type inmatePayBandDisplayDetails = {
  prisonerNumber: string
  firstName: string
  middleNames: string
  lastName: string
  incentiveLevel: string
  payBands: payBandDetail[]
}

export default class PayBandMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmates } = req.session.allocateJourney
    const allPayBandsForActivity: payBandDetail[] = await this.getActivityPayRates(req, res)

    // Get the applicable paybands per prisoner needing to be allocated
    const payBandsPerInmate: inmatePayBandDisplayDetails[] = []
    inmates.forEach(inmate => {
      const relevantPaybands = payBandWithDescription(allPayBandsForActivity, inmate.incentiveLevel)
      payBandsPerInmate.push({
        prisonerNumber: inmate.prisonerNumber,
        firstName: inmate.firstName,
        middleNames: inmate.middleNames,
        lastName: inmate.lastName,
        incentiveLevel: inmate.incentiveLevel,
        payBands: relevantPaybands,
      })
    })

    const payBandsToAutomaticallyAssign = payBandsPerInmate.filter(inmate => inmate.payBands.length === 1)
    const payBandsRequiringManualAssign = payBandsPerInmate.filter(inmate => inmate.payBands.length > 1)

    // if all prisoners can have their payband set automatically, redirect the page without rendering
    if (!payBandsRequiringManualAssign.length) {
      addPayBand(inmates, payBandsToAutomaticallyAssign)
      req.session.allocateJourney.inmates = inmates
      return res.redirect('check-and-confirm-multiple')
    }

    // if any paybands need manually picking, display them as radios
    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/payBandMultiple', {
      payBandsToAutomaticallyAssign,
      payBandsRequiringManualAssign,
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
    const { activity } = req.session.allocateJourney

    const payRates = (await this.activitiesService.getActivity(activity.activityId, res.locals.user))?.pay

    return _.sortBy(payRates, 'prisonPayBand.displaySequence').map(pay => ({
      bandId: pay.prisonPayBand.id,
      bandAlias: pay.prisonPayBand.alias,
      rate: pay.rate,
      startDate: pay.startDate,
      incentiveLevel: pay.incentiveLevel,
    }))
  }
}

export function payBandWithDescription(originalPayBands: payBandDetail[], incentiveLevel: string): payBandDetail[] {
  const formattedPayBands: payBandDetail[] = []
  const relevantOriginalPayBands = originalPayBands.filter(pb => pb.incentiveLevel === incentiveLevel)
  const uniquePayBandIds = [...new Set(relevantOriginalPayBands.map(pay => pay.bandId))]
  uniquePayBandIds.forEach(i => {
    const payBand = singlePayBandForPayBandId(relevantOriginalPayBands, i)
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
