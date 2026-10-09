import { Request, Response } from 'express'
import { when } from 'jest-when'
import createHttpError from 'http-errors'

import initialiseJourney from './initialiseJourney'
import { Services } from '../../../../../services'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import { ServiceUser } from '../../../../../@types/express'
import atLeast from '../../../../../../jest.setup'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { BookAProbationMeetingJourney } from '../journey'
import { AppointmentSearchResult } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')

describe('initialiseJourney', () => {
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  const next = jest.fn()

  const bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
  const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
  const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

  const middleware = initialiseJourney({
    activitiesService,
    bookAVideoLinkService,
    prisonService,
  } as unknown as Services)

  beforeEach(() => {
    jest.resetAllMocks()

    req = {
      params: {},
      journeyData: {},
    } as unknown as Request

    res = {
      locals: {
        user,
      },
    } as unknown as Response

    when(bookAVideoLinkService.getVideoLinkBookingById)
      .calledWith(123, user)
      .mockResolvedValue({
        statusCode: 'ACTIVE',
        probationTeamCode: 'TEAM1',
        probationMeetingType: 'INITIAL',
        notesForStaff: 'Staff notes',
        notesForPrisoners: 'Prisoner notes',
        prisonAppointments: [
          {
            appointmentType: 'VLB_PROBATION',
            prisonerNumber: 'A1234AA',
            prisonCode: 'MDI',
            appointmentDate: '2024-06-01',
            startTime: '09:00',
            endTime: '10:00',
            dpsLocationId: 123,
          },
        ],
      } as unknown as VideoLinkBooking)

    when(prisonService.getInmateByPrisonerNumber)
      .calledWith(atLeast('A1234AA'))
      .mockResolvedValue({
        firstName: 'John',
        lastName: 'Smith',
        prisonerNumber: 'A1234AA',
        prisonId: 'MDI',
        cellLocation: '1-1-001',
        status: 'ACTIVE IN',
      } as Prisoner)

    activitiesService.searchAppointments.mockResolvedValue([
      {
        appointmentId: 999,
        category: { code: 'VLPM' },
        internalLocation: { dpsLocationId: 123 },
        startTime: '09:00',
        endTime: '10:00',
      },
    ] as unknown as AppointmentSearchResult[])
  })

  it('should call next if journey is already populated for the booking', async () => {
    req.params = { bookingId: '123' }

    req.journeyData.bookAProbationMeetingJourney = {
      bookingId: 123,
    } as BookAProbationMeetingJourney

    await middleware(req, res, next)

    expect(bookAVideoLinkService.getVideoLinkBookingById).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should throw 404 when no probation appointment exists', async () => {
    req.params = { bookingId: '123' }

    bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue({
      prisonAppointments: [],
    } as VideoLinkBooking)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
  })

  it('should populate the probation meeting journey', async () => {
    req.params = { bookingId: '123' }

    await middleware(req, res, next)

    expect(req.journeyData.bookAProbationMeetingJourney).toEqual(
      expect.objectContaining({
        bookingId: 123,
        appointmentId: 999,
        bookingStatus: 'ACTIVE',
        prisonCode: 'MDI',
        locationId: 123,
        probationTeamCode: 'TEAM1',
        meetingTypeCode: 'INITIAL',
        probationTeamRequired: true,
        probationOfficerDetailsKnown: false,
        notesForStaff: 'Staff notes',
        notesForPrisoners: 'Prisoner notes',
        date: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String),
        prisoner: {
          name: 'John Smith',
          firstName: 'John',
          lastName: 'Smith',
          number: 'A1234AA',
          prisonCode: 'MDI',
          cellLocation: '1-1-001',
          status: 'ACTIVE IN',
        },
      }),
    )

    expect(next).toHaveBeenCalled()
  })

  it('should populate res.locals with the initialised journey', async () => {
    req.params = { bookingId: '123' }

    await middleware(req, res, next)

    expect(res.locals.bookAProbationMeetingJourney).toEqual(req.journeyData.bookAProbationMeetingJourney)

    expect(next).toHaveBeenCalled()
  })
})
