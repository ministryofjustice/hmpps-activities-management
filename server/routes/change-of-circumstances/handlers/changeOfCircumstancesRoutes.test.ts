import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import ChangeOfCircumstanceRoutes from './changeOfCircumstanceRoutes'
import { EventReview, EventReviewSearchResults } from '../../../@types/activitiesAPI/types'
import { PageLink } from '../../../utils/paginationUtils'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Select period for changes', () => {
  const handler = new ChangeOfCircumstanceRoutes(activitiesService)
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
      await handler.GET(req, res)
      const viewContext = { date: `2023-05-16`, page: 0, changeEvents: changeEvents.content, pagination }
      expect(res.render).toHaveBeenCalledWith('pages/change-of-circumstances/view-events', viewContext)
    })
  })
})
