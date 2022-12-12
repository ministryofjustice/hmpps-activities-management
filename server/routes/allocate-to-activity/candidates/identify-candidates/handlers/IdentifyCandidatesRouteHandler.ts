import { Request, Response } from 'express'
import { mapToTableRow } from './identifyCandidatesHelper'
import PrisonService from '../../../../../services/prisonService'
import CapacitiesService from '../../../../../services/capacitiesService'
import ActivitiesService from '../../../../../services/activitiesService'
import { comparePrisoners } from '../../../../../utils/utils'

export default class IdentifyCandidatesRouteHandler {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly capacitiesService: CapacitiesService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId } = req.params
    const { user } = res.locals
    const { data = {} } = req.session
    const { activityCandidateListCriteria = { sort: { field: 'name', direction: 'asc' } } } = data

    const [offenderListPage, allocationsSummary, schedule] = await Promise.all([
      this.prisonService.getInmates(user.activeCaseLoad.caseLoadId, user),
      this.capacitiesService.getScheduleAllocationsSummary(+scheduleId, user),
      this.activitiesService.getActivitySchedule(+scheduleId, user),
    ])

    const offenderListPageSorted = {
      ...offenderListPage,
      content: offenderListPage.content.sort(
        comparePrisoners(
          activityCandidateListCriteria.sort.field,
          activityCandidateListCriteria.sort.direction === 'desc',
        ),
      ),
    }

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
      rowData: offenderListPageSorted.content.map(mapToTableRow),
      criteria: activityCandidateListCriteria,
    }
    res.render('pages/allocate-to-activity/candidates/identify-candidates/index', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId } = req.params
    const { sort } = req.query
    const { data = {} } = req.session
    const { activityCandidateListCriteria = {} } = data
    let sortElements = ['name', 'asc']
    if (typeof sort === 'string') {
      sortElements = sort.split(':')
    }
    req.session.data = {
      ...data,
      activityCandidateListCriteria: {
        ...activityCandidateListCriteria,
        sort: {
          field: sortElements[0],
          direction: sortElements[1],
        },
      },
    }
    return res.redirect(`/activities/allocate/${scheduleId}/candidates/identify-candidates`)
  }
}
