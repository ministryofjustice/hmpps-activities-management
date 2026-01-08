import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import HowToAddOptions from '../../../../../enum/allocations'
import ActivitiesService from '../../../../../services/activitiesService'
import { AllocateToActivityJourney } from '../../journey'
import findNextSchedulesInstance from '../../../../../utils/helpers/nextScheduledInstanceCalculator'
import MetricsService from '../../../../../services/metricsService'
import { initJourneyMetrics } from '../../../../../utils/metricsUtils'
import MetricsEvent from '../../../../../data/metricsEvent'

export class SetUpPrisonerListForm {
  @Expose()
  @IsEnum(HowToAddOptions, { message: 'Select one option' })
  howToAdd: HowToAddOptions
}

export default class SetUpPrisonerListMethodRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly metricsServices: MetricsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    initJourneyMetrics(req, 'Other people')
    this.metricsServices.trackEvent(
      MetricsEvent.CREATE_MULTIPLE_ALLOCATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
    )

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/setUpPrisonerListMethod')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { howToAdd } = req.body
    const { scheduleId } = req.query
    const { user } = res.locals

    const schedule = await this.activitiesService.getActivitySchedule(+scheduleId, user)

    req.journeyData.allocateJourney = {
      activity: {
        activityId: schedule.activity.id,
        scheduleId: schedule.id,
        name: schedule.description,
        location: schedule.internalLocation?.description,
        inCell: schedule.activity.inCell,
        onWing: schedule.activity.onWing,
        offWing: schedule.activity.offWing,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        scheduleWeeks: schedule.scheduleWeeks,
        paid: schedule.activity.paid,
      },
      inmates: [],
      exclusions: [],
      updatedExclusions: [],
      scheduledInstance: findNextSchedulesInstance(schedule),
    } as AllocateToActivityJourney

    if (HowToAddOptions[howToAdd] === HowToAddOptions.SEARCH) {
      res.redirect('select-prisoner')
    } else if (HowToAddOptions[howToAdd] === HowToAddOptions.CSV) {
      res.redirect('upload-prisoner-list')
    } else if (HowToAddOptions[howToAdd] === HowToAddOptions.EXISTING_LIST) {
      res.redirect('from-activity-list')
    }
  }
}
