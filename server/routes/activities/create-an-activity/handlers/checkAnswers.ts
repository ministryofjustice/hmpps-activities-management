import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCreateRequest, Slot } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { mapJourneySlotsToActivityRequest, toMoney } from '../../../../utils/utils'
import { customSlotsToSchedule, regimeSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import IncentiveLevelPayMappingUtil from '../../../../utils/helpers/incentiveLevelPayMappingUtil'
import { eventTierDescriptions } from '../../../../enum/eventTiers'
import { organiserDescriptions } from '../../../../enum/eventOrganisers'
import MetricsEvent from '../../../../data/metricsEvent'
import MetricsService from '../../../../services/metricsService'

export default class CheckAnswersRoutes {
  private readonly helper: IncentiveLevelPayMappingUtil

  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly metricsService: MetricsService,
  ) {
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

    const getSlots = async () => {
      if (createJourney.customSlots === undefined) {
        const regimeTimes = await this.activitiesService.getPrisonRegime(user.activeCaseLoadId, user)
        return regimeSlotsToSchedule(createJourney.scheduleWeeks, createJourney.slots, regimeTimes)
      }
      return customSlotsToSchedule(createJourney.scheduleWeeks, createJourney.customSlots)
    }

    const slots = await getSlots()

    res.render(`pages/activities/create-an-activity/check-answers`, {
      incentiveLevelPays,
      slots,
      tier: eventTierDescriptions[createJourney.tierCode],
      organiser: organiserDescriptions[createJourney.organiserCode],
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createJourney } = req.session

    const slots: Slot[] =
      createJourney.customSlots !== undefined
        ? createJourney.customSlots
        : mapJourneySlotsToActivityRequest(createJourney.slots)

    const activity = {
      prisonCode: user.activeCaseLoadId,
      summary: createJourney.name,
      categoryId: createJourney.category.id,
      tierCode: createJourney.tierCode,
      organiserCode: createJourney.organiserCode,
      riskLevel: createJourney.riskLevel,
      attendanceRequired: createJourney.attendanceRequired,
      paid: createJourney.paid,
      pay: createJourney.pay.map(pay => ({
        incentiveNomisCode: pay.incentiveNomisCode,
        incentiveLevel: pay.incentiveLevel,
        payBandId: pay.prisonPayBand.id,
        rate: pay.rate,
      })),
      payChange: createJourney.payChange.map(pay => ({
        incentiveNomisCode: pay.incentiveNomisCode,
        incentiveLevel: pay.incentiveLevel,
        payBandId: pay.prisonPayBand.id,
        rate: pay.rate,
        changedDetails: `New pay rate added: ${toMoney(pay.rate)}`,
        changedBy: user.username,
      })),
      minimumEducationLevel: createJourney.educationLevels,
      description: createJourney.name,
      startDate: createJourney.startDate,
      endDate: createJourney.endDate,
      inCell: createJourney.inCell,
      onWing: createJourney.onWing,
      offWing: createJourney.offWing,
      dpsLocationId: createJourney.location?.id,
      capacity: createJourney.capacity,
      scheduleWeeks: createJourney.scheduleWeeks,
      slots,
      runsOnBankHoliday: createJourney.runsOnBankHoliday,
    } as ActivityCreateRequest

    if (createJourney.flat && createJourney.flat.length > 0) {
      const incentiveLevels = await this.prisonService.getIncentiveLevels(user.activeCaseLoadId, user)

      createJourney.flat.forEach(flatRate => {
        incentiveLevels.forEach(iep => {
          activity.pay.push({
            incentiveNomisCode: iep.levelCode,
            incentiveLevel: iep.levelName,
            payBandId: flatRate.prisonPayBand.id,
            rate: flatRate.rate,
          })

          activity.payChange.push({
            incentiveNomisCode: iep.levelCode,
            incentiveLevel: iep.levelName,
            payBandId: flatRate.prisonPayBand.id,
            rate: flatRate.rate,
            changedDetails: `New pay rate added: ${toMoney(flatRate.rate)}`,
            changedBy: user.username,
          })
        })
      })
    }

    const createdActivity = await this.activitiesService.createActivity(activity, user)

    const metricEvent = MetricsEvent.CREATE_ACTIVITY_JOURNEY_COMPLETED(res.locals.user).addJourneyCompletedMetrics(req)
    this.metricsService.trackEvent(metricEvent)

    res.redirect(`confirmation/${createdActivity.id}`)
  }
}
