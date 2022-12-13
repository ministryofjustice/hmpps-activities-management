import { Request, Response } from 'express'
import PrisonService from '../../../../../services/prisonService'
import ActivityService from '../../../../../services/activitiesService'
import CapacitiesService from '../../../../../services/capacitiesService'
import { InmateBasicDetails } from '../../../../../@types/prisonApiImport/types'
import { PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'

export default class PeopleAllocatedNowRouteHandler {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly capacitiesService: CapacitiesService,
    private readonly activitiesService: ActivityService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { scheduleId } = req.params

    const allocations = await this.activitiesService.getAllocations(scheduleId as unknown as number, user)
    const prisonerNumbers = allocations.map(allocation => allocation.prisonerNumber)
    const [inmateDetails, allocationsSummary, schedule, prisonerAllocations] = await Promise.all([
      this.prisonService.getInmateDetails(prisonerNumbers, user),
      this.capacitiesService.getScheduleAllocationsSummary(+scheduleId, user),
      this.activitiesService.getActivitySchedule(scheduleId as unknown as number, user),
      this.activitiesService.getPrisonerAllocations(user.activeCaseLoad.caseLoadId, prisonerNumbers, user),
    ])

    const rowData = inmateDetails.map(inmate => this.toRowData(inmate, prisonerAllocations))

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
      rowData,
    }
    res.render('pages/allocate-to-activity/candidates/people-allocated-now/index', viewContext)
  }

  private toRowData(prisoner: InmateBasicDetails, allocations: PrisonerAllocations[]) {
    const result = allocations.reduce((map, obj) => {
      // eslint-disable-next-line no-param-reassign
      map[obj.prisonerNumber] = obj
      return map
    }, {})

    return {
      name: `${prisoner.firstName} ${prisoner.lastName}`,
      prisonNumber: prisoner.offenderNo,
      location: prisoner.assignedLivingUnitDesc,
      allocations: result[prisoner.offenderNo].allocations
        .map((allocation: { scheduleDescription: string }) => allocation.scheduleDescription)
        .sort(),
    }
  }
}
