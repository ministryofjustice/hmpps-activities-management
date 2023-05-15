import { Request } from 'express'
import ActivitiesService from './activitiesService'
import EditAppointmentService from './editAppointmentService'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason } from '../@types/appointments'
import { parseDate } from '../utils/utils'

jest.mock('./activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Edit Appointment Service', () => {
  const service = new EditAppointmentService(activitiesService)
  let req: Request

  beforeEach(() => {
    req = {
      session: {
        appointmentJourney: {
          location: {
            id: 1,
            description: 'Location',
          },
          startDate: {
            day: 15,
            month: 5,
            year: 2023,
            date: parseDate('2023-05-15'),
          },
          startTime: {
            hour: 9,
            minute: 30,
            date: parseDate('2023-05-15T09:30', "yyyy-MM-dd'T'HH:mm"),
          },
          endTime: {
            hour: 13,
            minute: 0,
            date: parseDate('2023-05-15T13:00', "yyyy-MM-dd'T'HH:mm"),
          },
        } as unknown as AppointmentJourney,
        editAppointmentJourney: {} as EditAppointmentJourney,
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getEditMessage', () => {
    it('when cancelling an appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

      expect(service.getEditMessage(req)).toEqual('cancel')
    })

    it('when deleting an appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

      expect(service.getEditMessage(req)).toEqual('delete')
    })

    it('when changing the comment', () => {
      req.session.editAppointmentJourney.comment = 'Updated comment'

      expect(service.getEditMessage(req)).toEqual('change the heads up for')
    })

    it('when changing the location', () => {
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      expect(service.getEditMessage(req)).toEqual('change the location for')
    })

    it('when changing the start date', () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }

      expect(service.getEditMessage(req)).toEqual('change the date for')
    })

    it('when changing the start time', () => {
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the time for')
    })

    it('when changing the end time', () => {
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the time for')
    })

    it('when changing the start time and end time', () => {
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
      }
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the time for')
    })

    it('when changing the start date and start time', () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-16T10:00', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the date and time for')
    })

    it('when changing the start date and end time', () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-16T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the date and time for')
    })

    it('when changing the start date, start time and end time', () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-16T10:00', "yyyy-MM-dd'T'HH:mm"),
      }
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-16T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the date and time for')
    })
  })
})
