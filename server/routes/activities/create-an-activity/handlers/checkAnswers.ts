import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCreateRequest } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { mapJourneySlotsToActivityRequest } from '../../../../utils/utils'
import activitySessionToDailyTimeSlots from '../../../../utils/helpers/activityTimeSlotMappers'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'

export default class CheckAnswersRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {
    this.helper = new IncentiveLevelPayMappingUtil(prisonService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session
    const incentiveLevelPays = await this.helper.getPayGroupedByIncentiveLevel(
      createJourney.pay,
      createJourney.allocations,
      user,
    )
    res.render(`pages/activities/create-an-activity/check-answers`, {
      incentiveLevelPays,
      dailySlots: activitySessionToDailyTimeSlots(createJourney.scheduleWeeks, createJourney.slots),
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
        payBandId: pay.prisonPayBand.id,
        rate: pay.rate,
      })),
      minimumEducationLevel: createJourney.educationLevels,
      description: createJourney.name,
      startDate: createJourney.startDate,
      endDate: createJourney.endDate,
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
            payBandId: flatRate.prisonPayBand.id,
            rate: flatRate.rate,
          }),
        )
      })
    }

    const response = await this.activitiesService.createActivity(activity, user)

    res.redirect(`confirmation/${response.id}`)
  }
}
