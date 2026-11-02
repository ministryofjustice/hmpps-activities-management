import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import ChangeOfCircumstanceRoutes from './changeOfCircumstanceRoutes'
import { changeFilters } from './changeFilters'
import { EventReview, EventReviewSearchResults } from '../../../../@types/activitiesAPI/types'
import { PageLink } from '../../../../utils/paginationUtils'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Changes in circumstances', () => {
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
          firstName: 'Bob',
          lastName: 'Bobson',
          cellLocation: '1-12-123',
        }
      })
      const viewContext = {
        searchTerm: '',
        selectedFilters: [],
        filterItems: changeFilters.map(({ value, text }) => ({ value, text, checked: false })),
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

  describe('filters', () => {
    beforeEach(() => {
      activitiesService.getChangeEvents.mockResolvedValue({ ...changeEvents, content: [...content] })
      activitiesService.getChangeEventPrisonerNumbers.mockResolvedValue(['A1234AA', 'B1234BB'])
      prisonService.searchInmatesByPrisonerNumbers.mockResolvedValue(prisoners)
    })

    it('passes matching prisoner numbers and selected event codes to the API', async () => {
      req.query.searchTerm = ' BOBSON '
      req.query.changeTypes = ['non-associations', 'unknown', 'non-associations']
      prisonService.searchPrisonerNumbers.mockResolvedValue(['A1234AA', 'B1234BB'])
      await handler.GET(req, res)
      expect(prisonService.searchPrisonerNumbers).toHaveBeenCalledWith(
        'BOBSON',
        ['A1234AA', 'B1234BB'],
        res.locals.user,
      )
      expect(activitiesService.getChangeEvents).toHaveBeenCalledWith(
        'MDI',
        {
          date: '2023-05-16',
          page: 0,
          size: 10,
          prisonerNumbers: ['A1234AA', 'B1234BB'],
          eventCodes: ['prison-offender-events.prisoner.non-association-detail.changed'],
        },
        res.locals.user,
      )
      expect(res.render).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          searchTerm: 'BOBSON',
          selectedFilters: ['non-associations'],
        }),
      )
    })

    it('limits candidate events to the selected prison, date and change types', async () => {
      req.query.searchTerm = 'Bob'
      req.query.changeTypes = 'alerts'
      prisonService.searchPrisonerNumbers.mockResolvedValue(['A1234AA'])
      await handler.GET(req, res)
      expect(activitiesService.getChangeEventPrisonerNumbers).toHaveBeenCalledWith(
        'MDI',
        {
          date: '2023-05-16',
          eventCodes: ['prisoner-offender-search.prisoner.alerts-updated'],
        },
        res.locals.user,
      )
    })

    it('searches a complete prison number directly without scanning candidate events', async () => {
      req.query.searchTerm = 'a1234aa'
      activitiesService.getChangeEventPrisonerNumbers.mockClear()
      await handler.GET(req, res)
      expect(activitiesService.getChangeEventPrisonerNumbers).not.toHaveBeenCalled()
      expect(activitiesService.getChangeEvents).toHaveBeenLastCalledWith(
        'MDI',
        {
          date: '2023-05-16',
          page: 0,
          size: 10,
          prisonerNumbers: ['A1234AA'],
        },
        res.locals.user,
      )
    })

    it('does not fetch unfiltered changes when no prisoners match the search', async () => {
      req.query.searchTerm = 'Nobody'
      prisonService.searchPrisonerNumbers.mockResolvedValue([])
      activitiesService.getChangeEvents.mockClear()
      await handler.GET(req, res)
      expect(activitiesService.getChangeEvents).not.toHaveBeenCalled()
      expect(res.render).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ changeEvents: [] }))
    })

    it.each([
      ['alerts', ['prisoner-offender-search.prisoner.alerts-updated']],
      ['non-associations', ['prison-offender-events.prisoner.non-association-detail.changed']],
      ['cell-moves', ['prisoner-offender-search.prisoner.updated', 'prison-offender-events.prisoner.cell.move']],
      ['releases-and-transfers', ['prisoner-offender-search.prisoner.released']],
      [
        'incentive-levels',
        ['incentives.iep-review.inserted', 'incentives.iep-review.updated', 'incentives.iep-review.deleted'],
      ],
      ['arrivals-and-returns', ['prisoner-offender-search.prisoner.received']],
    ])('uses the API event codes for %s', async (filter, eventCodes) => {
      req.query.changeTypes = filter
      await handler.GET(req, res)
      expect(activitiesService.getChangeEvents).toHaveBeenLastCalledWith(
        'MDI',
        {
          date: '2023-05-16',
          page: 0,
          size: 10,
          eventCodes,
        },
        res.locals.user,
      )
    })

    it('preserves filters in pagination links and uses API totals', async () => {
      req.query.changeTypes = ['alerts', 'cell-moves']
      req.query.searchTerm = 'Bob & Joe'
      Object.defineProperty(req, 'protocol', { value: 'http' })
      req.originalUrl =
        '/activities/change-of-circumstances/view-changes?date=2023-05-16&searchTerm=Bob+%26+Joe&changeTypes=alerts&changeTypes=cell-moves'
      prisonService.searchPrisonerNumbers.mockResolvedValue(['A1234AA'])
      activitiesService.getChangeEvents.mockResolvedValue({ ...changeEvents, totalElements: 21, totalPages: 3 })
      await handler.GET(req, res)
      const context = (res.render as jest.Mock).mock.calls[0][1]
      expect(context.pagination.results.count).toBe(21)
      const next = new URL(context.pagination.next.href)
      expect(next.searchParams.getAll('changeTypes')).toEqual(['alerts', 'cell-moves'])
      expect(next.searchParams.get('searchTerm')).toBe('Bob & Joe')
      expect(next.searchParams.get('page')).toBe('1')
    })

    it('redirects an empty last page to the last valid page and retains the filters', async () => {
      req.query.page = '1'
      req.query.changeTypes = 'alerts'
      Object.defineProperty(req, 'protocol', { value: 'http' })
      req.originalUrl = '/activities/change-of-circumstances/view-changes?date=2023-05-16&changeTypes=alerts&page=1'
      activitiesService.getChangeEvents.mockResolvedValue({
        ...changeEvents,
        content: [],
        totalElements: 10,
        totalPages: 1,
        pageNumber: 1,
      })
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('view-changes?date=2023-05-16&changeTypes=alerts&page=0')
      expect(res.render).not.toHaveBeenCalled()
    })

    it.each(['-1', '1.5', 'invalid'])('defaults an invalid page %s to zero', async page => {
      req.query.page = page
      await handler.GET(req, res)
      expect(activitiesService.getChangeEvents).toHaveBeenLastCalledWith(
        'MDI',
        {
          date: '2023-05-16',
          page: 0,
          size: 10,
        },
        res.locals.user,
      )
    })

    it('preserves filters after acknowledging changes', async () => {
      req.body = {
        date: '2023-05-16',
        page: 0,
        selectedEvents: '1',
        searchTerm: 'Bob & Joe',
        changeTypes: ['alerts', 'cell-moves'],
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(
        'view-changes?date=2023-05-16&page=0&searchTerm=Bob+%26+Joe&changeTypes=alerts&changeTypes=cell-moves',
      )
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
