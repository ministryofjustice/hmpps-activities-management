import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min, ValidateNested, ValidationArguments } from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../../../services/activitiesService'
import { addPayBand, getApplicablePayBandsForInmates, PayBandDetail } from '../../../../../utils/helpers/allocationUtil'

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

export default class PayBandMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmates } = req.session.allocateJourney
    const allPayBandsForActivity: PayBandDetail[] = await this.getActivityPayRates(req, res)

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
          numberPayBandsAvailable: 1,
        }
      })

      addPayBand(inmates, payBandsForInmates)
      req.session.allocateJourney.inmates = inmates
      return res.redirect('check-answers')
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
      const payBandDetails = paybandsAvailablePerInmate.find(p => p.prisonerNumber === i.prisonerNumber).payBands
      const matchingPayBand = payBandDetails.find(b => b.bandId === +i.payBand)
      i.payBandDetails = matchingPayBand
      i.numberPayBandsAvailable = payBandDetails.length
    })

    // assign the automatic paybands
    const inmatesWithOneAvailablePayband = paybandsAvailablePerInmate.filter(inmate => inmate.payBands.length === 1)

    inmatesWithOneAvailablePayband.forEach(inmate => {
      inmatePayData.push({
        prisonerNumber: inmate.prisonerNumber,
        incentiveLevel: inmate.incentiveLevel,
        payBandDetails: inmate.payBands[0],
        numberPayBandsAvailable: 1,
      })
    })

    const allInmatesWithPayBands = inmatePayData.map(pay => {
      return {
        prisonerNumber: pay.prisonerNumber,
        payBandDetail: pay.payBandDetails,
        numberPayBandsAvailable: pay.numberPayBandsAvailable,
      }
    })

    addPayBand(inmates, allInmatesWithPayBands)
    req.session.allocateJourney.inmates = inmates
    return res.redirect('check-answers')
  }

  private async getActivityPayRates(req: Request, res: Response): Promise<PayBandDetail[]> {
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
