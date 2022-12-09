import { Request, Response } from 'express'
import CapacitiesService from '../../../../../services/capacitiesService'
import ActivitiesService from '../../../../../services/activitiesService'
import { mapToTableRows } from './scheduleHelper'

export default class ScheduleRouteHandler {
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
          path: `/activities/allocate/${scheduleId}/candidates/people-allocated-now`,
          testId: 'people-allocated-now',
        },
        {
          title: 'Identify candidates',
          path: `/activities/allocate/${scheduleId}/candidates/identify-candidates`,
          testId: 'identify-candidates',
          titleDecorator: `${allocationsSummary.vacancies} vacancies`,
          titleDecoratorClass: 'govuk-tag govuk-tag--red',
        },
        {
          title: 'Activity risk requirements',
          path: `/activities/allocate/${scheduleId}/candidates/activity-risk-requirements`,
          testId: 'activity-risk-requirements',
        },
        {
          title: `${schedule.description} schedule`,
          path: `/activities/allocate/${scheduleId}/candidates/schedule`,
          testId: 'schedule',
        },
      ],
      scheduleDescription: schedule.description,
      rowData: mapToTableRows(schedule),
    }
    res.render('pages/allocate-to-activity/candidates/schedule/index', viewContext)
  }
}
