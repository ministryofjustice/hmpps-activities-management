import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ActivitiesOrchestratorService from '../../../../services/activitiesOrchestratorService'
import PrisonService from '../../../../services/prisonService'
import ChangeOfCircumstanceRoutes from './changeOfCircumstanceRoutes'
import { changeFilters } from './changeFilters'
import { EventReviewSearchResultsDto, EventReviewDto } from '../../../../@types/activitiesOrchestratorAPI/types'
import { PageLink } from '../../../../utils/paginationUtils'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import UserService from '../../../../services/userService'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/activitiesOrchestratorService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const activitiesOrchestratorService = new ActivitiesOrchestratorService(
  null,
) as jest.Mocked<ActivitiesOrchestratorService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const userService = new UserService(null) as jest.Mocked<UserService>

describe('Route Handlers - Changes in circumstances', () => {
  const handler = new ChangeOfCircumstanceRoutes(
    activitiesService,
    activitiesOrchestratorService,
    prisonService,
    userService,
  )
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

  const content: EventReviewDto[] = [
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
      acknowledgedBy: undefined,
      activeAllocations: [],
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
      acknowledgedBy: undefined,
      activeAllocations: [],
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
      acknowledgedBy: undefined,
      activeAllocations: [],
    },
  ]

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
  } as EventReviewSearchResultsDto

  const pagination = {
    items: [] as PageLink[],
    results: { from: 1, to: 3, count: 3, text: 'changes' },
    classes: 'govuk-!-font-size-19',
  }

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesOrchestratorService.getEventsForReview).mockResolvedValue(changeEvents)
      when(prisonService.searchInmatesByPrisonerNumbers).mockResolvedValue(prisoners)
      await handler.GET(req, res)
      const results = changeEvents.content.map(item => {
        return {
          ...item,
          firstName: 'Bob',
          lastName: 'Bobson',
          middleNames: '',
          cellLocation: '1-12-123',
          alertsAddedFlags: [],
          alertsClosedFlags: [],
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
        reviewed: false,
        hasFilters: false,
        changesToReviewHref: 'view-changes?date=2023-05-16',
        reviewedChangesHref: 'view-changes?date=2023-05-16&reviewed=true',
        clearFiltersHref: 'view-changes?date=2023-05-16',
      }
      expect(res.render).toHaveBeenCalledWith('pages/activities/change-of-circumstances/view-events', viewContext)
    })
  })

  describe('filters', () => {
    beforeEach(() => {
      activitiesOrchestratorService.getEventsForReview.mockResolvedValue(changeEvents)
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
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenCalledWith(
        {
          filterAcknowledged: false,
          filterEventTypes: ['prison-offender-events.prisoner.non-association-detail.changed'],
          page: 0,
          pageSize: 25,
          prisonCode: 'MDI',
          prisonerNumbers: ['A1234AA', 'B1234BB'],
          requestDate: '2023-05-16',
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
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenLastCalledWith(
        {
          filterAcknowledged: false,
          page: 0,
          pageSize: 25,
          prisonCode: 'MDI',
          prisonerNumbers: ['A1234AA'],
          requestDate: '2023-05-16',
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
    ])('uses the API event codes for %s', async (filter, filterEventTypes) => {
      req.query.changeTypes = filter
      await handler.GET(req, res)
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenLastCalledWith(
        {
          filterAcknowledged: false,
          filterEventTypes,
          page: 0,
          pageSize: 25,
          prisonCode: 'MDI',
          requestDate: '2023-05-16',
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
      activitiesOrchestratorService.getEventsForReview.mockResolvedValue({
        ...changeEvents,
        totalElements: 51,
        totalPages: 3,
      })
      await handler.GET(req, res)
      const context = (res.render as jest.Mock).mock.calls[0][1]
      expect(context.pagination.results.count).toBe(51)
      const next = new URL(context.pagination.next.href)
      expect(next.searchParams.getAll('changeTypes')).toEqual(['alerts', 'cell-moves'])
      expect(next.searchParams.get('searchTerm')).toBe('Bob & Joe')
      expect(next.searchParams.get('page')).toBe('1')
    })

    it.each([
      [0, 25, 1, 25],
      [0, 51, 1, 25],
      [1, 51, 26, 50],
      [2, 51, 51, 51],
    ])('calculates 25-row pagination for page %s of %s changes', async (page, total, from, to) => {
      req.query.page = String(page)
      activitiesOrchestratorService.getEventsForReview.mockResolvedValue({
        content: Array.from({ length: to - from + 1 }, (_, index) => ({ ...content[0], eventReviewId: from + index })),
        totalElements: total,
        totalPages: Math.ceil(total / 25),
        pageNumber: page,
      })
      await handler.GET(req, res)
      const context = (res.render as jest.Mock).mock.calls[0][1]
      expect(context.pagination.results).toEqual({ from, to, count: total, text: 'changes' })
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenLastCalledWith(
        {
          prisonCode: 'MDI',
          requestDate: '2023-05-16',
          page,
          pageSize: 25,
          filterAcknowledged: false,
        },
        res.locals.user,
      )
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
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenLastCalledWith(
        {
          prisonCode: 'MDI',
          requestDate: '2023-05-16',
          page: 0,
          pageSize: 25,
          filterAcknowledged: false,
        },
        res.locals.user,
      )
    })

    it('applies the prisoner and change filters to reviewed results and retains the tab when clearing', async () => {
      req.query.reviewed = 'true'
      req.query.searchTerm = 'a1234aa'
      req.query.changeTypes = 'cell-moves'
      await handler.GET(req, res)
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenLastCalledWith(
        {
          prisonCode: 'MDI',
          requestDate: '2023-05-16',
          page: 0,
          pageSize: 25,
          prisonerNumbers: ['A1234AA'],
          filterEventTypes: ['prisoner-offender-search.prisoner.updated', 'prison-offender-events.prisoner.cell.move'],
          filterAcknowledged: true,
        },
        res.locals.user,
      )
      expect(res.render).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          clearFiltersHref: 'view-changes?date=2023-05-16&reviewed=true',
          hasFilters: true,
        }),
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

  describe('review tabs', () => {
    beforeEach(() => {
      activitiesOrchestratorService.getEventsForReview.mockResolvedValue({
        ...changeEvents,
        totalElements: 75,
        totalPages: 3,
      })
      activitiesService.getChangeEventPrisonerNumbers.mockResolvedValue(['A1234AA'])
      prisonService.searchPrisonerNumbers.mockResolvedValue(['A1234AA'])
      prisonService.searchInmatesByPrisonerNumbers.mockResolvedValue(prisoners)
    })

    it.each([
      ['true', true],
      ['false', false],
      [undefined, false],
    ])('requests the correct review state for %s', async (value, expected) => {
      req.query.reviewed = value
      await handler.GET(req, res)
      expect(activitiesOrchestratorService.getEventsForReview).toHaveBeenLastCalledWith(
        {
          prisonCode: 'MDI',
          requestDate: '2023-05-16',
          page: 0,
          pageSize: 25,
          filterAcknowledged: expected,
        },
        res.locals.user,
      )
      expect(res.render).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ reviewed: expected }))
    })

    it('keeps the date, search and filters in tab links while resetting pagination', async () => {
      req.query.page = '2'
      req.query.searchTerm = 'Smith & Jones'
      req.query.changeTypes = ['alerts', 'cell-moves']
      await handler.GET(req, res)
      const context = (res.render as jest.Mock).mock.calls[0][1]
      for (const href of [context.changesToReviewHref, context.reviewedChangesHref]) {
        const query = new URL(href, 'http://localhost').searchParams
        expect(query.get('date')).toBe('2023-05-16')
        expect(query.get('searchTerm')).toBe('Smith & Jones')
        expect(query.getAll('changeTypes')).toEqual(['alerts', 'cell-moves'])
        expect(query.has('page')).toBe(false)
      }
      expect(context.hasFilters).toBe(true)
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
