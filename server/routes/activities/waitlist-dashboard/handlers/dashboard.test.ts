import { Request, Response } from 'express'
import { when } from 'jest-when'
import { startOfToday, subMonths } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import DashboardRoutes, { DashboardFrom } from './dashboard'
import { ServiceUser } from '../../../../@types/express'
import {
  ActivitySummary,
  WaitingListApplication,
  WaitingListApplicationPaged,
  WaitingListSearchParams,
  WaitingListSearchRequest,
} from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import { WaitingListStatus } from '../../../../enum/waitingListStatus'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Waitlist application - Edit Status', () => {
  const handler = new DashboardRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  const waitingListApplication = {
    id: 1,
    prisonerNumber: 'ABC1234',
    activityId: 1,
    scheduleId: 2,
    requestedBy: 'OMU_STAFF',
  } as WaitingListApplication

  const waitingListSearchResults = {
    content: [waitingListApplication],
    totalPages: 1,
    pageNumber: 0,
    totalElements: 1,
    first: true,
    last: false,
  } as WaitingListApplicationPaged

  const activity = {
    id: 1,
  } as ActivitySummary

  const prisoner = {
    prisonerNumber: 'ABC1234',
  } as Prisoner

  beforeEach(() => {
    res = {
      locals: { user },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      body: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should display waiting list applications matching default filters', async () => {
      req.query = {}

      const filters = {
        applicationDateFrom: formatIsoDate(subMonths(startOfToday(), 1)),
        applicationDateTo: formatIsoDate(startOfToday()),
        activityId: null,
        status: [WaitingListStatus.PENDING, WaitingListStatus.APPROVED],
        prisonerNumbers: undefined,
      } as WaitingListSearchRequest

      const pageOptions = {
        page: 0,
        pageSize: 20,
      } as WaitingListSearchParams

      when(activitiesService.searchWaitingListApplications)
        .calledWith(user.activeCaseLoadId, filters, pageOptions, user)
        .mockResolvedValueOnce(waitingListSearchResults)

      when(activitiesService.getActivities).calledWith(false, user).mockResolvedValueOnce([activity])

      when(prisonService.searchInmatesByPrisonerNumbers).calledWith(['ABC1234'], user).mockResolvedValueOnce([prisoner])

      await handler.GET(req, res)

      expect(prisonService.searchPrisonInmates).toBeCalledTimes(0)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/waitlist-dashboard/dashboard',
        expect.objectContaining({
          applications: [
            {
              ...waitingListApplication,
              requestedBy: 'Offender Management Unit',
              prisoner,
              activity,
            },
          ],
          filters,
          activities: [activity],
          pageInfo: {
            totalPages: waitingListSearchResults.totalPages,
            pageNumber: waitingListSearchResults.number,
            totalElements: waitingListSearchResults.totalElements,
            first: waitingListSearchResults.first,
            last: waitingListSearchResults.last,
          },
          WaitingListStatus,
        }),
      )
    })

    it('should display waiting list applications matching filters', async () => {
      req.query = {
        dateFrom: '2023-01-01',
        dateTo: '2023-02-01',
        activity: '2',
        status: 'PENDING,DECLINED',
        query: 'ABC1234',
        page: '2',
      }

      const filters = {
        applicationDateFrom: '2023-01-01',
        applicationDateTo: '2023-02-01',
        activityId: 2,
        status: [WaitingListStatus.PENDING, WaitingListStatus.DECLINED],
        prisonerNumbers: ['ABC1234'],
      } as WaitingListSearchRequest

      const pageOptions = {
        page: 2,
        pageSize: 20,
      } as WaitingListSearchParams

      when(prisonService.searchPrisonInmates)
        .calledWith('ABC1234', user)
        .mockResolvedValueOnce({
          content: [prisoner],
        })

      when(activitiesService.searchWaitingListApplications)
        .calledWith(user.activeCaseLoadId, filters, pageOptions, user)
        .mockResolvedValueOnce(waitingListSearchResults)

      when(activitiesService.getActivities).calledWith(false, user).mockResolvedValueOnce([activity])

      await handler.GET(req, res)

      expect(prisonService.searchInmatesByPrisonerNumbers).toBeCalledTimes(0)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/waitlist-dashboard/dashboard',
        expect.objectContaining({
          applications: [
            {
              ...waitingListApplication,
              requestedBy: 'Offender Management Unit',
              prisoner,
              activity,
            },
          ],
          filters,
          activities: [activity],
          pageInfo: {
            totalPages: waitingListSearchResults.totalPages,
            pageNumber: waitingListSearchResults.number,
            totalElements: waitingListSearchResults.totalElements,
            first: waitingListSearchResults.first,
            last: waitingListSearchResults.last,
          },
          WaitingListStatus,
        }),
      )
    })
  })

  describe('POST', () => {
    it('should post empty filters and redirect', async () => {
      req.body = {}

      await handler.POST(req, res)

      res.redirect('waitlist-dashboard')
    })

    it('should post filters and redirect', async () => {
      req.body = {
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-02-01'),
        activity: '2',
        status: 'PENDING,DECLINED',
        query: 'ABC1234',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        'waitlist-dashboard?query=ABC1234&dateFrom=2023-01-01&dateTo=2023-02-01&activity=2&status=PENDING,DECLINED',
      )
    })
  })

  describe('VIEW_APPLICATION', () => {
    it('should redirect to view allocation page', async () => {
      req.body = {
        selectedWaitlistApplication: '123',
        dashboardUrl: 'waitlist-dashboard',
      }

      await handler.VIEW_APPLICATION(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `/activities/waitlist/view-and-edit/123/view?journeyEntry=waitlist-dashboard`,
      )
    })
  })

  describe('ALLOCATE', () => {
    it('should redirect to the allocation page', async () => {
      req.body.selectedWaitlistApplication = '1'

      when(activitiesService.fetchWaitlistApplication).calledWith(1, user).mockResolvedValueOnce(waitingListApplication)

      await handler.ALLOCATE(req, res)

      expect(res.redirect).toBeCalledWith(
        `/activities/allocations/create/prisoner/ABC1234` +
          `?scheduleId=2` +
          `&source=waitlist-dashboard` +
          `&selectedWaitlistApplication=1`,
      )
    })
  })

  describe('Validation', () => {
    it('should pass validation if dateFrom and dateTo is valid', async () => {
      const body = {
        dateFrom: '01/01/2023',
        dateTo: '01/02/2023',
      }

      const requestObject = plainToInstance(DashboardFrom, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should fail validation if dateFrom is invalid', async () => {
      const body = {
        dateFrom: 'invalid',
        dateTo: '01/02/2023',
      }

      const requestObject = plainToInstance(DashboardFrom, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'dateFrom', error: 'Enter a valid date from' }])
    })

    it('should fail validation if dateTo is invalid', async () => {
      const body = {
        dateFrom: '01/01/2023',
        dateTo: 'invalid',
      }

      const requestObject = plainToInstance(DashboardFrom, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'dateTo', error: 'Enter a valid date to' }])
    })
  })
})
