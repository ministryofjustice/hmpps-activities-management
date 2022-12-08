import { Request, Response } from 'express'
import PrisonService from '../../../../../services/prisonService'
import ActivityService from '../../../../../services/activitiesService'
import { mapToTableRow } from './peopleAllocatedNowHelper'

export default class PeopleAllocatedNowRouteHandler {
  constructor(private readonly activitiesService: ActivityService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { scheduleId } = req.params

    const schedule = await this.activitiesService.getSchedule(scheduleId as unknown as number, user)
    const allocations = await this.activitiesService.getAllocations(scheduleId as unknown as number, user)
    const prisonerNumbers = allocations.map(allocation => allocation.prisonerNumber)
    const inmateDetails = await this.prisonService.getInmateDetails(prisonerNumbers, user)
    const rowData = inmateDetails.map(mapToTableRow)

    const viewContext = {
      pageHeading: `Identify candidates for ${schedule.description}`,
      currentUrlPath: req.baseUrl + req.path,
      tabs: [
        {
          title: 'People allocated now',
          path: `/activities/allocate/${scheduleId}/candidates/people-allocated-now/`,
          testId: 'people-allocated-now',
        },
        {
          title: 'Identify candidates',
          path: `/activities/allocate/${scheduleId}/candidates/identify-candidates/`,
          testId: 'identify-candidates',
          titleDecorator: '1 vacancy',
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
      rowData,
    }
    res.render('pages/allocate-to-activity/candidates/people-allocated-now/index', viewContext)
  }
}
