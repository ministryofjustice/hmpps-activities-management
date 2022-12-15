import { Request, Response } from 'express'
import CapacitiesService from '../../../services/capacitiesService'
import ActivitiesService from '../../../services/activitiesService'

export default class ScheduleRoutes {
  constructor(
    private readonly capacitiesService: CapacitiesService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId } = req.params
    const { user } = res.locals

    const [allocationsSummary, schedule] = await Promise.all([
      this.capacitiesService.getScheduleAllocationsSummary(+scheduleId, user),
      this.activitiesService.getActivitySchedule(+scheduleId, user),
    ])

    const viewContext = {
      pageHeading: `Identify candidates for ${schedule.description}`,
      currentUrlPath: req.baseUrl + req.path,
      tabs: [
        {
          title: 'People allocated now',
          path: `/allocate/${scheduleId}/people-allocated-now`,
          testId: 'people-allocated-now',
        },
        {
          title: 'Identify candidates',
          path: `/allocate/${scheduleId}/identify-candidates`,
          testId: 'identify-candidates',
          titleDecorator: `${allocationsSummary.vacancies} vacancies`,
          titleDecoratorClass: 'govuk-tag govuk-tag--red',
        },
        {
          title: 'Activity risk requirements',
          path: `/allocate/${scheduleId}/activity-risk-requirements`,
          testId: 'activity-risk-requirements',
        },
        {
          title: `${schedule.description} schedule`,
          path: `/allocate/${scheduleId}/schedule`,
          testId: 'schedule',
        },
      ],
      scheduleDescription: schedule.description,
      schedule,
    }
    res.render('pages/allocate-to-activity/schedule', viewContext)
  }
}
