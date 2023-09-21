import { Request, Response } from 'express'
import { addDays, format } from 'date-fns'
import { when } from 'jest-when'
import LocationsRoutes from './locations'
import ActivitiesService from '../../../../services/activitiesService'
import DateOption from '../../../../enum/dateOption'
import TimeSlot from '../../../../enum/timeSlot'
import { InternalLocationEventsSummary } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Movement list routes - choose details', () => {
  const handler = new LocationsRoutes(activitiesService)
  let req: Request
  let res: Response

  const locations = [
    {
      id: 1,
      prisonCode: 'MDI',
      code: 'EDUC-ED1-ED1',
      description: 'Education 1',
    },
  ] as InternalLocationEventsSummary[]

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request

    when(activitiesService.getInternalLocationEventsSummaries).mockResolvedValue(locations)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('renders the expected view with view data', async () => {
      const dateOption = DateOption.TODAY
      const date = format(new Date(), 'yyyy-MM-dd')
      const timeSlot = TimeSlot.AM
      req.query = {
        dateOption,
        date,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/locations', {
        dateOption,
        date,
        timeSlot,
        locations,
      })
    })

    it('redirects back when date is invalid', async () => {
      const dateOption = DateOption.OTHER
      const date = 'invalid'
      const timeSlot = TimeSlot.AM
      req.query = {
        dateOption,
        date,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('choose-details')
    })

    it("uses today's date when date option is today", async () => {
      const dateOption = DateOption.TODAY
      const date = '2023-09-20'
      const timeSlot = TimeSlot.PM
      req.query = {
        dateOption,
        date,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/locations', {
        dateOption,
        date: format(new Date(), 'yyyy-MM-dd'),
        timeSlot,
        locations,
      })
    })

    it("uses tomorrow's date when date option is tomorrow", async () => {
      const dateOption = DateOption.TOMORROW
      const date = '2023-09-20'
      const timeSlot = TimeSlot.PM
      req.query = {
        dateOption,
        date,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/locations', {
        dateOption,
        date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        timeSlot,
        locations,
      })
    })

    it('uses supplied date when date option is other', async () => {
      const dateOption = DateOption.OTHER
      const date = '2023-09-20'
      const timeSlot = TimeSlot.PM
      req.query = {
        dateOption,
        date,
        timeSlot,
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/movement-list/locations', {
        dateOption,
        date,
        timeSlot,
        locations,
      })
    })
  })
})
