import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import SearchRoutes, { Search } from './search'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty, toDateString } from '../../../../utils/utils'
import { ServiceUser } from '../../../../@types/express'
import ActivitiesService from '../../../../services/activitiesService'
import {
  AppointmentCategorySummary,
  AppointmentLocationSummary,
  AppointmentSearchResult,
} from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Appointments Management - Search Results', () => {
  const handler = new SearchRoutes(activitiesService, prisonService)
  const user = { activeCaseLoadId: 'MDI', username: 'USER1', firstName: 'John', lastName: 'Smith' } as ServiceUser
  let req: Request
  let res: Response
  const today = new Date()
  const categories = [
    {
      code: 'CHAP',
      description: 'Chaplaincy',
    },
    {
      code: 'MEDO',
      description: 'Medical - Doctor',
    },
    {
      code: 'GYMW',
      description: 'Gym - Weights',
    },
  ] as AppointmentCategorySummary[]
  const appointmentNameFilters = ['Chaplaincy', 'Gym - Weights', 'Medical - Doctor']
  const locations = [
    {
      id: 26152,
      description: 'Chapel',
    },
    {
      id: 26149,
      description: 'Gym',
    },
    {
      id: 26151,
      description: 'Library',
    },
  ] as AppointmentLocationSummary[]
  const appointment1 = {
    appointmentSeriesId: 1,
    appointmentId: 2,
    appointmentType: 'INDIVIDUAL',
    attendees: [
      {
        prisonerNumber: 'A1111AA',
      },
    ],
    appointmentName: 'Chaplaincy',
    category: {
      code: 'CHAP',
      description: 'Chaplaincy',
    },
    internalLocation: {
      description: 'Test Location 1',
    },
    startDate: '2023-05-26',
    startTime: '09:30',
    endTime: '11:00',
    isRepeat: false,
    sequenceNumber: 1,
    maxSequenceNumber: 1,
  }
  const appointment2 = {
    appointmentSeriesId: 2,
    appointmentId: 3,
    appointmentType: 'GROUP',
    attendees: [
      {
        prisonerNumber: 'A1111AA',
      },
      {
        prisonerNumber: 'B2222BB',
      },
      {
        prisonerNumber: 'C3333CC',
      },
    ],
    appointmentName: 'Medical - Doctor',
    category: {
      code: 'MEDO',
      description: 'Medical - Doctor',
    },
    internalLocation: {
      description: 'Test Location 2',
    },
    startDate: '2022-12-01',
    startTime: '13:00',
    endTime: '14:30',
    isRepeat: true,
    sequenceNumber: 2,
    maxSequenceNumber: 6,
  }
  const appointment3 = {
    appointmentSeriesId: 3,
    appointmentId: 4,
    appointmentType: 'INDIVIDUAL',
    attendees: [
      {
        prisonerNumber: 'A1111AA',
      },
    ],
    appointmentName: 'Doctors appointment (Medical - Doctor)',
    category: {
      code: 'MEDO',
      description: 'Medical - Doctor',
    },
    internalLocation: {
      description: 'Test Location 2',
    },
    startDate: '2022-12-01',
    startTime: '13:00',
    endTime: '14:30',
    isRepeat: true,
    sequenceNumber: 2,
    maxSequenceNumber: 6,
  }

  const results = [appointment1, appointment2, appointment3] as AppointmentSearchResult[]

  beforeEach(() => {
    req = {} as unknown as Request

    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    jest.resetAllMocks()
  })

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)
      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1111AA'], user)
        .mockResolvedValue([
          {
            firstName: 'Lee',
            lastName: 'Jacobson',
            prisonerNumber: 'A1111AA',
            cellLocation: '1-1-1',
          } as Prisoner,
        ])
    })

    it('should populate start date and redirect if start date is not supplied', async () => {
      req.query = {}

      await handler.GET(req, res)

      expect(activitiesService.getAppointmentCategories).not.toHaveBeenCalled()
      expect(activitiesService.getAppointmentLocations).not.toHaveBeenCalled()
      expect(activitiesService.searchAppointments).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(`?startDate=${toDateString(new Date())}`)
    })

    it('should populate start date and redirect if start date is invalid', async () => {
      req.query = {
        startDate: '2021-10-40',
      }

      await handler.GET(req, res)

      expect(activitiesService.getAppointmentCategories).not.toHaveBeenCalled()
      expect(activitiesService.getAppointmentLocations).not.toHaveBeenCalled()
      expect(activitiesService.searchAppointments).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(`?startDate=${toDateString(new Date())}`)
    })

    it('should render the default search view with categories, locations and search results', async () => {
      req.query = {
        startDate: toDateString(today),
      }

      when(activitiesService.searchAppointments)
        .calledWith(
          'MDI',
          {
            startDate: toDateString(today),
            timeSlot: null,
            internalLocationId: null,
            prisonerNumbers: null,
            createdBy: null,
          },
          user,
        )
        .mockResolvedValue(results)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/search/results', {
        startDate: expect.any(SimpleDate),
        timeSlot: '',
        appointmentNameFilters,
        appointmentName: '',
        locations,
        locationId: '',
        prisonerNumber: '',
        createdBy: '',
        results,
        prisonersDetails: {
          A1111AA: {
            firstName: 'Lee',
            lastName: 'Jacobson',
            prisonerNumber: 'A1111AA',
            cellLocation: '1-1-1',
          },
        },
      })
    })

    it('should render fully filtered search view with categories, locations and search results', async () => {
      req.query = {
        startDate: toDateString(today),
        timeSlot: TimeSlot.PM,
        appointmentName: 'Medical - Doctor',
        locationId: '26151',
        prisonerNumber: 'A1234BC',
        createdBy: user.username,
      }

      when(activitiesService.searchAppointments)
        .calledWith(
          'MDI',
          {
            startDate: toDateString(today),
            timeSlot: TimeSlot.PM as unknown as 'AM' | 'PM' | 'ED',
            internalLocationId: 26151,
            prisonerNumbers: ['A1234BC'],
            createdBy: user.username,
          },
          user,
        )
        .mockResolvedValue(results)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/search/results', {
        startDate: expect.any(SimpleDate),
        timeSlot: TimeSlot.PM,
        appointmentNameFilters,
        appointmentName: 'Medical - Doctor',
        locations,
        locationId: '26151',
        prisonerNumber: 'A1234BC',
        createdBy: user.username,
        results: [appointment2, appointment3],
        prisonersDetails: {
          A1111AA: {
            firstName: 'Lee',
            lastName: 'Jacobson',
            prisonerNumber: 'A1111AA',
            cellLocation: '1-1-1',
          },
        },
      })
    })

    it('should filter results by matching appointment name', async () => {
      req.query = {
        startDate: toDateString(today),
        appointmentName: 'Doctors appointment (Medical - Doctor)',
      }

      when(activitiesService.searchAppointments)
        .calledWith(
          'MDI',
          {
            startDate: toDateString(today),
            timeSlot: null,
            internalLocationId: null,
            prisonerNumbers: null,
            createdBy: null,
          },
          user,
        )
        .mockResolvedValue(results)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/search/results',
        expect.objectContaining({
          results: [appointment3],
        }),
      )
    })
  })

  describe('POST', () => {
    it('should redirect to default get', async () => {
      req.body = {
        startDate: simpleDateFromDate(today),
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `?startDate=${toDateString(new Date())}&timeSlot=&appointmentName=&locationId=&prisonerNumber=&createdBy=`,
      )
    })

    it('should redirect to fully filtered get', async () => {
      req.body = {
        startDate: simpleDateFromDate(today),
        timeSlot: TimeSlot.PM,
        appointmentName: 'Medical - Doctor',
        locationId: '26151',
        prisonerNumber: 'A1234BC',
        createdBy: user.username,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `?startDate=${toDateString(new Date())}&timeSlot=${
          TimeSlot.PM
        }&appointmentName=Medical - Doctor&locationId=26151&prisonerNumber=A1234BC&createdBy=${user.username}`,
      )
    })
  })

  describe('Validation', () => {
    it('validation fails when no date is specified', async () => {
      const body = {}

      const requestObject = plainToInstance(Search, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { error: 'Enter a valid date', property: 'startDate' },
          { error: 'Enter a date', property: 'startDate' },
        ]),
      )
    })
  })
})
