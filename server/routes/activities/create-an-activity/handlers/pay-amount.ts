import { Request, Response } from 'express'
import { Expose, Transform, Type } from 'class-transformer'
import { IsNumber, Min, ValidationArguments } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import PayRateBetweenMinAndMax from '../../../../validators/payRateBetweenMinAndMax'
import { ActivityPay, PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import { CreateAnActivityJourney } from '../journey'
import { AgencyPrisonerPayProfile } from '../../../../@types/prisonApiImport/types'
import CurrentPayRateSameAsPreviousRate from '../../../../validators/currentPayRateSameAsPreviousRate'
import { parseIsoDate } from '../../../../utils/datePickerUtils'

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
  @CurrentPayRateSameAsPreviousRate({
    message: 'The pay amount must be different to the previous amount',
  })
  rate: number
}

export default class PayAmountRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
  ) {}

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

    req.journeyData.createJourney.pay ??= []
    req.journeyData.createJourney.minimumPayRate = minimumPayRate
    req.journeyData.createJourney.maximumPayRate = maximumPayRate

    const sortedActivityPayList: ActivityPay[] = req.journeyData.createJourney?.pay
      ?.filter(p => p.prisonPayBand.id === +bandId && p.incentiveLevel === iep)
      .sort(
        (a, b) =>
          (a.startDate != null ? parseIsoDate(a.startDate).getTime() : 0) -
          (b.startDate != null ? parseIsoDate(b.startDate).getTime() : 0),
      )

    req.journeyData.createJourney.previousPayRate =
      sortedActivityPayList?.at(sortedActivityPayList.length - 1).rate ||
      req.journeyData.createJourney?.flat?.find(p => p.prisonPayBand.id === +bandId)?.rate

    const band = payBands.find(p => p.id === +bandId)

    res.render(`pages/activities/create-an-activity/pay-amount`, {
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
    const { paymentStartDate } = req.query
    const { rate, incentiveLevel, bandId } = req.body

    return res.redirect(
      `../pay-date-option/single?iep=${incentiveLevel}&bandId=${bandId}&paymentStartDate=${paymentStartDate}&rate=${rate}&preserveHistory=true`,
    )
  }
}
