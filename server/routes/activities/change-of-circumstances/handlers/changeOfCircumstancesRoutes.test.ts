import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import ChangeOfCircumstanceRoutes from './changeOfCircumstanceRoutes'
import { EventReview, EventReviewSearchResults } from '../../../../@types/activitiesAPI/types'
import { PageLink } from '../../../../utils/paginationUtils'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Select period for changes', () => {
  const handler = new ChangeOfCircumstanceRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: { activeCaseLoadId: 'MDI' },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {
        date: `2023-05-16`,
        page: 0,
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get: (host: string) => {
        return 'localhost'
      },
      originalUrl: 'http://localhost/',
    } as unknown as Request
  })

  const content = [
    {
      eventReviewId: 1,
      serviceIdentifier: null,
      eventType: 'prison-offender-events.prisoner.non-association-detail.changed',
      eventTime: '2023-05-16T12:17:53',
      prisonCode: 'MDI',
      bookingId: 1,
      prisonerNumber: 'A1234AA',
      eventData: 'Some data',
      acknowledgedTime: null,
      acknowledgedBy: null,
    },
    {
      eventReviewId: 2,
      serviceIdentifier: null,
      eventType: 'prison-offender-events.prisoner.non-association-detail.changed',
      eventTime: '2023-05-16T12:17:53',
      prisonCode: 'MDI',
      bookingId: 1,
      prisonerNumber: 'A1234AA',
      eventData: 'Some data',
      acknowledgedTime: null,
      acknowledgedBy: null,
    },
    {
      eventReviewId: 3,
      serviceIdentifier: null,
      eventType: 'prison-offender-events.prisoner.non-association-detail.changed',
      eventTime: '2023-05-16T12:17:53',
      prisonCode: 'MDI',
      bookingId: 1,
      prisonerNumber: 'A1234AA',
      eventData: 'Some data',
      acknowledgedTime: null,
      acknowledgedBy: null,
    },
  ] as EventReview[]

  const prisoners = [
    {
      prisonerNumber: 'A1234AA',
      cellLocation: '1-12-123',
      firstName: 'Bob',
      lastName: 'Bobson',
      dateOfBirth: '11-02-1976',
    },
  ] as Prisoner[]

  const changeEvents = {
    content,
    totalElements: 3,
    totalPages: 1,
    pageNumber: 0,
  } as EventReviewSearchResults

  const pagination = {
    items: [] as PageLink[],
    results: { from: 1, to: 3, count: 3 },
    classes: 'govuk-!-font-size-19',
  }

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getChangeEvents).mockResolvedValue(changeEvents)
      when(prisonService.searchInmatesByPrisonerNumbers).mockResolvedValue(prisoners)
      await handler.GET(req, res)
      const results = changeEvents.content.map(item => {
        return {
          ...item,
          name: 'Bob Bobson',
          cellLocation: '1-12-123',
        }
      })
      const viewContext = {
        date: `2023-05-16`,
        page: 0,
        changeEvents: results,
        pagination,
        isToday: false,
        isYesterday: false,
      }
      expect(res.render).toHaveBeenCalledWith('pages/activities/change-of-circumstances/view-events', viewContext)
    })
  })

  describe('POST', () => {
    it('should submit event IDs for acknowledgement and redirect to view', async () => {
      req = {
        body: { date: '2023-10-01', page: 0, selectedEvents: ['1', '2', '3'] },
      } as unknown as Request
      when(activitiesService.acknowledgeChangeEvents).mockResolvedValue()
      await handler.POST(req, res)
      expect(activitiesService.acknowledgeChangeEvents).toHaveBeenCalledWith('MDI', [1, 2, 3], res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${req.body.date}&page=${req.body.page}`)
    })

    it('should submit  single event ID and redirect to view', async () => {
      req = {
        body: { date: '2023-10-01', page: 1, selectedEvents: '1' },
      } as unknown as Request
      when(activitiesService.acknowledgeChangeEvents).mockResolvedValue()
      await handler.POST(req, res)
      expect(activitiesService.acknowledgeChangeEvents).toHaveBeenCalledWith('MDI', [1], res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${req.body.date}&page=${req.body.page}`)
    })

    it('should handle no selected items - not currently possible in the UI', async () => {
      req = {
        body: { date: '2023-10-01', page: 1, selectedEvents: undefined },
      } as unknown as Request
      when(activitiesService.acknowledgeChangeEvents).mockResolvedValue()
      await handler.POST(req, res)
      expect(activitiesService.acknowledgeChangeEvents).toHaveBeenCalledWith('MDI', [], res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith(`view-changes?date=${req.body.date}&page=${req.body.page}`)
    })
  })
})
