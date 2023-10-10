import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCreateRequest } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import { formatDate, mapJourneySlotsToActivityRequest } from '../../../../utils/utils'
import activitySessionToDailyTimeSlots from '../../../../utils/helpers/activityTimeSlotMappers'
import IncentiveLevelPayMappingUtil from '../../helpers/incentiveLevelPayMappingUtil'

export default class CheckAnswersRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(createJourney.pay, user)
    const startDate = formatDate(plainToInstance(SimpleDate, createJourney.startDate).toRichDate(), 'do MMMM yyyy')
    const endDate = createJourney.endDate
      ? formatDate(plainToInstance(SimpleDate, createJourney.endDate).toRichDate(), 'do MMMM yyyy')
      : 'Not set'
    const flatPay = req.session.createJourney.flat
    res.render(`pages/activities/create-an-activity/check-answers`, {
      incentiveLevelPays,
      dailySlots: activitySessionToDailyTimeSlots(createJourney.scheduleWeeks, createJourney.slots),
      startDate,
      endDate,
      flatPay,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session

    const slots = mapJourneySlotsToActivityRequest(createJourney.slots)

    const activity = {
      prisonCode: user.activeCaseLoadId,
      summary: createJourney.name,
      categoryId: createJourney.category.id,
      riskLevel: createJourney.riskLevel,
      minimumIncentiveNomisCode: createJourney.minimumIncentiveNomisCode,
      minimumIncentiveLevel: createJourney.minimumIncentiveLevel,
      pay: createJourney.pay.map(pay => ({
        incentiveNomisCode: pay.incentiveNomisCode,
        incentiveLevel: pay.incentiveLevel,
        payBandId: pay.bandId,
        rate: pay.rate,
      })),
      minimumEducationLevel: createJourney.educationLevels,
      description: createJourney.name,
      startDate: formatDate(plainToInstance(SimpleDate, createJourney.startDate).toRichDate(), 'yyyy-MM-dd'),
      endDate: createJourney.endDate
        ? formatDate(plainToInstance(SimpleDate, createJourney.endDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
      inCell: createJourney.inCell,
      onWing: createJourney.onWing,
      offWing: createJourney.offWing,
      locationId: createJourney.location?.id,
      capacity: createJourney.capacity,
      scheduleWeeks: createJourney.scheduleWeeks,
      slots,
      runsOnBankHoliday: createJourney.runsOnBankHoliday,
    } as ActivityCreateRequest

    if (createJourney.flat && createJourney.flat.length > 0) {
      const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

      createJourney.flat.forEach(flatRate => {
        incentiveLevels.forEach(iep =>
          activity.pay.push({
            incentiveNomisCode: iep.levelCode,
            incentiveLevel: iep.levelName,
            payBandId: flatRate.bandId,
            rate: flatRate.rate,
          }),
        )
      })
    }

    const response = await this.activitiesService.createActivity(activity, user)

    res.redirect(`confirmation/${response.id}`)
  }
}
