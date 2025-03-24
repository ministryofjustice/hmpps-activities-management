import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min, ValidateNested, ValidationArguments } from 'class-validator'
import _ from 'lodash'
import { startOfToday } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import { addPayBand, payBandDetail } from '../../../../../utils/helpers/allocationUtil'
import { formatDate, parseISODate, toMoney } from '../../../../../utils/utils'
import { Inmate } from '../../journey'

const getPrisonerName = (args: ValidationArguments) => (args.object as PayBandMultiple)?.prisonerName

export class PayBandMultiple {
  prisonerName: string

  prisonerNumber: string

  @Expose()
  @Type(() => Number)
  @Min(1, { message: args => `Select a pay band for ${getPrisonerName(args)}` })
  payBand: number
}

export class PayBandMultipleForm {
  @Type(() => PayBandMultiple)
  @ValidateNested({ each: true })
  inmatePayData: PayBandMultiple[]
}

type inmatePayBandDisplayDetails = {
  prisonerNumber: string
  firstName: string
  middleNames: string
  lastName: string
  incentiveLevel: string
  prisonId: string
  payBands: payBandDetail[]
}

export default class PayBandMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmates } = req.session.allocateJourney
    const allPayBandsForActivity: payBandDetail[] = await this.getActivityPayRates(req, res)

    // Get the applicable paybands per prisoner needing to be allocated
    const payBandsPerInmate = getApplicablePayBandsForInmates(inmates, allPayBandsForActivity)

    const payBandsToAutomaticallyAssign = payBandsPerInmate.filter(inmate => inmate.payBands.length === 1)
    const payBandsRequiringManualAssign = payBandsPerInmate.filter(inmate => inmate.payBands.length > 1)

    // if all prisoners can have their payband set automatically, redirect the page without rendering
    if (!payBandsRequiringManualAssign.length) {
      const payBandsForInmates = payBandsToAutomaticallyAssign.map(pay => {
        return {
          prisonerNumber: pay.prisonerNumber,
          payBandDetail: pay.payBands[0],
        }
      })

      addPayBand(inmates, payBandsForInmates)
      req.session.allocateJourney.inmates = inmates
      return res.redirect('check-and-confirm')
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/payBandMultiple', {
      payBandsToAutomaticallyAssign,
      payBandsRequiringManualAssign,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmatePayData } = req.body
    const { inmates } = req.session.allocateJourney

    const activityPayBands = await this.getActivityPayRates(req, res)
    const paybandsAvailablePerInmate = getApplicablePayBandsForInmates(inmates, activityPayBands)

    // assign the manually chosen paybands
    inmatePayData.forEach(async inmate => {
      const i = inmate
      const payBandDetails: payBandDetail = paybandsAvailablePerInmate
        .find(p => p.prisonerNumber === i.prisonerNumber)
        .payBands.find(b => b.bandId === +i.payBand)
      i.payBandDetails = payBandDetails
    })

    // assign the automatic paybands
    const inmatesWithOneAvailablePayband = paybandsAvailablePerInmate.filter(inmate => inmate.payBands.length === 1)

    inmatesWithOneAvailablePayband.forEach(inmate => {
      inmatePayData.push({
        prisonerNumber: inmate.prisonerNumber,
        incentiveLevel: inmate.incentiveLevel,
        payBandDetails: inmate.payBands[0],
      })
    })

    const allInmatesWithPayBands = inmatePayData.map(pay => {
      return {
        prisonerNumber: pay.prisonerNumber,
        payBandDetail: pay.payBandDetails,
      }
    })

    addPayBand(inmates, allInmatesWithPayBands)
    req.session.allocateJourney.inmates = inmates
    return res.redirect('check-and-confirm')
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

function getApplicablePayBandsForInmates(
  inmates: Inmate[],
  allPayBandsForActivity: payBandDetail[],
): inmatePayBandDisplayDetails[] {
  const payBandsPerInmate: inmatePayBandDisplayDetails[] = []
  inmates.forEach(inmate => {
    const relevantPaybands = payBandWithDescription(allPayBandsForActivity, inmate.incentiveLevel)
    payBandsPerInmate.push({
      prisonerNumber: inmate.prisonerNumber,
      firstName: inmate.firstName,
      middleNames: inmate.middleNames,
      lastName: inmate.lastName,
      prisonId: inmate.prisonCode,
      incentiveLevel: inmate.incentiveLevel,
      payBands: relevantPaybands,
    })
  })
  return payBandsPerInmate
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
