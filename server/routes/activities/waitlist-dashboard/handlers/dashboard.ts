import { Request, Response } from 'express'
import { startOfToday, subMonths } from 'date-fns'
import { IsDate } from 'class-validator'
import { Transform } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { asString } from '../../../../utils/utils'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import { Prisoner } from '../../../../@types/activities'
import { WaitingListStatus } from '../../../../enum/waitingListStatus'

export class DashboardFrom {
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid date from' })
  dateFrom: Date

  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid date to' })
  dateTo: Date
}

export default class DashboardRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateFrom, dateTo, activity, status, query, page } = req.query

    const startDateFilter = dateFrom ? asString(dateFrom) : formatIsoDate(subMonths(startOfToday(), 1))
    const endDateFilter = dateTo ? asString(dateTo) : formatIsoDate(startOfToday())
    const activityFilter = activity ? +activity : null
    let statusFilter = [WaitingListStatus.PENDING, WaitingListStatus.APPROVED]
    if (status) {
      statusFilter = asString(status)
        .split(',')
        .map(s => WaitingListStatus[s])
    }

    let prisoners: Prisoner[] = null
    if (query) {
      prisoners = (await this.prisonService.searchPrisonInmates(asString(query), user)).content
    }

    const filters = {
      applicationDateFrom: startDateFilter,
      applicationDateTo: endDateFilter,
      activityId: activityFilter,
      status: statusFilter,
      prisonerNumbers: prisoners?.map(r => r.prisonerNumber),
    }

    const pageOptions = {
      page: page ? +page : 0,
      pageSize: 20,
    }

    const [applicationResults, activities] = await Promise.all([
      this.activitiesService.searchWaitingListApplications(user.activeCaseLoadId, filters, pageOptions, user),
      this.activitiesService.getActivities(false, user),
    ])

    if (!query) {
      const prisonerNumbers = applicationResults?.content.map(a => a.prisonerNumber)
      prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)
    }

    const applications = applicationResults?.content.map(waitlistApplication => ({
      ...waitlistApplication,
      activity: activities.find(act => act.id === waitlistApplication.activityId),
      prisoner: prisoners.find(p => p.prisonerNumber === waitlistApplication.prisonerNumber),
    }))

    const pageInfo = {
      totalPages: applicationResults.totalPages,
      pageNumber: applicationResults.number,
      totalElements: applicationResults.totalElements,
      first: applicationResults.first,
      last: applicationResults.last,
    }

    res.render('pages/activities/waitlist-dashboard/dashboard', {
      applications,
      filters,
      activities,
      query,
      pageInfo,
      WaitingListStatus,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { dateFrom, dateTo, activity, status, query } = req.body

    let queryString = '?'
    queryString += query ? `query=${asString(query)}&` : ''
    queryString += dateFrom ? `dateFrom=${formatIsoDate(dateFrom)}&` : ''
    queryString += dateTo ? `dateTo=${formatIsoDate(dateTo)}&` : ''
    queryString += activity ? `activity=${activity}&` : ''
    queryString += `status=${status ?? ''}&`
    queryString = queryString.slice(0, -1)

    res.redirect(`waitlist-dashboard${queryString}`)
  }

  VIEW_APPLICATION = async (req: Request, res: Response): Promise<void> => {
    const { selectedWaitlistApplication, dashboardUrl } = req.body
    res.redirect(`/activities/waitlist/view-and-edit/${selectedWaitlistApplication}/view?journeyEntry=${dashboardUrl}`)
  }

  ALLOCATE = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedWaitlistApplication } = req.body

    const application = await this.activitiesService.fetchWaitlistApplication(+selectedWaitlistApplication, user)
    res.redirect(
      `/activities/allocations/create/prisoner/${application.prisonerNumber}` +
        `?scheduleId=${application.scheduleId}` +
        `&source=waitlist-dashboard` +
        `&selectedWaitlistApplication=${application.id}`,
    )
  }
}
