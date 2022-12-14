import { Request, Response } from 'express'
import PrisonService from '../../../services/prisonService'
import CapacitiesService from '../../../services/capacitiesService'
import ActivitiesService from '../../../services/activitiesService'
import { comparePrisoners } from '../../../utils/utils'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'

export default class IdentifyCandidatesRoutes {
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
      rowData: offenderListPageSorted.content.map(this.mapToTableRow),
      criteria: activityCandidateListCriteria,
    }
    res.render('pages/allocate-to-activity/identify-candidates', viewContext)
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
    return res.redirect(`/allocate/${scheduleId}/identify-candidates`)
  }

  private mapToTableRow = (prisoner: Prisoner) => ({
    name: `${prisoner.lastName.charAt(0) + prisoner.lastName.substring(1).toLowerCase()}, ${
      prisoner.firstName.charAt(0) + prisoner.firstName.substring(1).toLowerCase()
    }`,
    prisonNumber: prisoner.prisonerNumber,
    location: prisoner.cellLocation,
    incentiveLevel: prisoner.currentIncentive.level.description,
    alerts: prisoner.alerts.filter(a => a.active && !a.expired).map(a => a.alertCode),
  })
}
