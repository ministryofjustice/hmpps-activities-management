import { Request, Response } from 'express'
import emptyEditAppointmentJourneyHandler from './emptyEditAppointmentJourneyHandler'
import { AppointmentJourneyMode, AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'

describe('emptyEditAppointmentJourneyHandler', () => {
  let req: Request
  let res: Response
  const next = jest.fn()
  const appointmentSeriesId = 1
  const appointmentId = 2

  beforeEach(() => {
    req = {
      session: {},
      journeyData: {},
      params: {
        appointmentSeriesId,
        appointmentId,
      },
    } as unknown as Request

    res = {
      redirect: jest.fn(),
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('step requires active appointment and edit appointment journeys in session', () => {
    const middleware = emptyEditAppointmentJourneyHandler(true)

    it('should redirect back to appointment details page when the appointment journey data is not in session', async () => {
      req.session.appointmentJourney = null
      req.journeyData.editAppointmentJourney = {
        numberOfAppointments: 1,
        appointments: [
          {
            sequenceNumber: 1,
            startDate: '2023-01-01',
            cancelled: false,
          },
        ],
        sequenceNumber: 1,
      }
      await middleware(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
    })

    it('should redirect back to appointment details page when the edit appointment journey data is not in session', async () => {
      req.session.appointmentJourney = {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        appointmentName: 'appointment name',
      }
      req.journeyData.editAppointmentJourney = null
      await middleware(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
    })

    it('should continue if both journeys data exists in session', async () => {
      req.session.appointmentJourney = {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        appointmentName: 'appointment name',
      }
      req.journeyData.editAppointmentJourney = {
        numberOfAppointments: 1,
        appointments: [
          {
            sequenceNumber: 1,
            startDate: '2023-01-01',
            cancelled: false,
          },
        ],
        sequenceNumber: 1,
      }
      await middleware(req, res, next)

      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('step does not require active appointment and edit appointment journeys in session', () => {
    const middleware = emptyEditAppointmentJourneyHandler(false)

    it('should continue when the journey data is not in session', async () => {
      req.journeyData.editAppointmentJourney = null
      await middleware(req, res, next)

      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })
})
