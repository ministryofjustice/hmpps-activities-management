import { Request, Response } from 'express'
import { mapToTableRow } from './identifyCandidatesHelper'
import PrisonService from '../../../../../services/prisonService'

export default class IdentifyCandidatesRouteHandler {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId } = req.params
    const { offenderListPage } = res.locals
    const { data = {} } = req.session
    const { activityCandidateListCriteria = {} } = data
    const viewContext = {
      pageHeading: 'Identify candidates for Wing cleaning 1',
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
          title: 'Wing cleaning 1 schedule',
          path: `/activities/allocate/${scheduleId}/candidates/schedule`,
          testId: 'schedule',
        },
      ],
      rowData: offenderListPage.content.map(mapToTableRow),
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
