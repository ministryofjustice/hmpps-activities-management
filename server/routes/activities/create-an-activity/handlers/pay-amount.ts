import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNumber, Min, ValidationArguments } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import PayRateBetweenMinAndMax from '../../../../validators/payRateBetweenMinAndMax'
import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { CreateAnActivityJourney } from '../journey'
import { AgencyPrisonerPayProfile } from '../../../../@types/prisonApiImport/types'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'

export class PayAmount {
  @Expose()
  @Type(() => Number)
  @Transform(({ value }) => Math.round(value * 100)) // Transform to pence
  @IsNumber({ allowNaN: false }, { message: 'Pay rate must be a number' })
  @Min(1, { message: 'Enter a pay rate' })
  @PayRateBetweenMinAndMax({
    message: (args: ValidationArguments) => {
      const { createJourney } = args.object as { createJourney: CreateAnActivityJourney }
      const { minimumPayRate, maximumPayRate } = createJourney
      return `Enter a pay amount that is at least £${minimumPayRate / 100} (minimum pay) and no more than £${
        maximumPayRate / 100
      } (maximum pay)`
    },
  })
  rate: number
}

export default class PayAmountRoutes {
  // TODO REMOVE HELPER
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
  ) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payRateType } = req.params
    const { iep, bandId, paymentStartDate } = req.query

    const [payBands, payProfile]: [PrisonPayBand[], AgencyPrisonerPayProfile] = await Promise.all([
      this.activitiesService.getPayBandsForPrison(user),
      this.prisonService.getPayProfile(user.activeCaseLoadId),
    ])

    const minimumPayRate = payProfile.minHalfDayRate * 100
    const maximumPayRate = payProfile.maxHalfDayRate * 100

    req.session.createJourney.pay ??= []
    req.session.createJourney.minimumPayRate = minimumPayRate
    req.session.createJourney.maximumPayRate = maximumPayRate

    const rate =
      req.session.createJourney?.pay?.find(
        p =>
          p.prisonPayBand.id === +bandId &&
          p.incentiveLevel === iep &&
          (p.startDate === paymentStartDate || p.startDate === undefined),
      )?.rate || req.session.createJourney?.flat?.find(p => p.prisonPayBand.id === +bandId)?.rate

    const band = payBands.find(p => p.id === +bandId)

    res.render(`pages/activities/create-an-activity/pay-amount`, {
      rate,
      iep,
      paymentStartDate,
      band,
      payRateType,
      payBands,
      minimumPayRate,
      maximumPayRate,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const originalPaymentStartDate = req.query.paymentStartDate
    const { rate, incentiveLevel, bandId } = req.body

    return res.redirect(
      `../pay-date-option/single?iep=${incentiveLevel}&bandId=${bandId}&paymentStartDate=${originalPaymentStartDate}&rate=${rate}&preserveHistory=true`,
    )
  }
}
