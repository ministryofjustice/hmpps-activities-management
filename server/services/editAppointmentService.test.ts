import { Request, Response } from 'express'
import ActivitiesService from './activitiesService'
import EditAppointmentService from './editAppointmentService'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason, EditApplyTo } from '../@types/appointments'
import { parseDate } from '../utils/utils'
import { AppointmentOccurrenceCancelRequest, AppointmentOccurrenceUpdateRequest } from '../@types/activitiesAPI/types'
import { YesNo } from '../@types/activities'

jest.mock('./activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Edit Appointment Service', () => {
  const service = new EditAppointmentService(activitiesService)
  let req: Request
  let res: Response
  const appointmentId = 1
  const occurrenceId = 2

  beforeEach(() => {
    req = {
      session: {
        appointmentJourney: {
          category: {
            code: 'TEST',
            description: 'Category',
          },
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
      params: {
        appointmentId,
        occurrenceId,
      },
      flash: jest.fn(),
    } as unknown as Request

    res = {
      locals: {
        user: {},
      },
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('get edit message, hint and edited message', () => {
    it('when cancelling an appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

      expect(service.getEditMessage(req)).toEqual('cancel')
      expect(service.getEditHintMessage(req)).toEqual('cancelling')
      expect(service.getEditedMessage(req)).toEqual('cancelled')
    })

    it('when deleting an appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

      expect(service.getEditMessage(req)).toEqual('delete')
      expect(service.getEditHintMessage(req)).toEqual('deleting')
      expect(service.getEditedMessage(req)).toEqual('deleted')
    })

    it('when changing the location', () => {
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      expect(service.getEditMessage(req)).toEqual('change the location for')
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the location for')
    })

    it('when changing the start date', () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }

      expect(service.getEditMessage(req)).toEqual('change the date for')
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the date for')
    })

    it('when changing the start time', () => {
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the time for')
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the time for')
    })

    it('when changing the end time', () => {
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the time for')
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the time for')
    })

    it('when changing the end time from null', () => {
      req.session.appointmentJourney.endTime = null
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(service.getEditMessage(req)).toEqual('change the time for')
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the time for')
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
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the time for')
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
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the date and time for')
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
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the date and time for')
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
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the date and time for')
    })

    it('when changing the comment', () => {
      req.session.editAppointmentJourney.comment = 'Updated comment'

      expect(service.getEditMessage(req)).toEqual('change the heads up for')
      expect(service.getEditHintMessage(req)).toEqual('changing')
      expect(service.getEditedMessage(req)).toEqual('changed the heads up for')
    })
  })

  describe('edit', () => {
    it('when cancelling an appointment', async () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          cancellationReasonId: +AppointmentCancellationReason.CANCELLED,
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceCancelRequest,
        res.locals.user,
      )
      expect(activitiesService.editAppointmentOccurrence).not.toHaveBeenCalled()
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've cancelled this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when deleting a non repeating appointment', async () => {
      req.session.appointmentJourney.repeat = YesNo.NO
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          cancellationReasonId: +AppointmentCancellationReason.CREATED_IN_ERROR,
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceCancelRequest,
        res.locals.user,
      )
      expect(activitiesService.editAppointmentOccurrence).not.toHaveBeenCalled()
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments`,
        "You've deleted the Category appointment - Monday, 15 May 2023",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the location', async () => {
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        { internalLocationId: 2, applyTo: EditApplyTo.THIS_OCCURRENCE } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the location for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the start date', async () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        { startDate: '2023-05-16', applyTo: EditApplyTo.THIS_OCCURRENCE } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the date for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the start time', async () => {
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
      }

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          startTime: '10:00',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the end time', async () => {
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          endTime: '14:30',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the end time from null', async () => {
      req.session.appointmentJourney.endTime = null
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          endTime: '14:30',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the start time and end time', async () => {
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

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          startTime: '10:00',
          endTime: '14:30',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the start date and start time', async () => {
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

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          startDate: '2023-05-16',
          startTime: '10:00',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the date and time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the start date and end time', async () => {
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

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          startDate: '2023-05-16',
          endTime: '14:30',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the date and time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the start date, start time and end time', async () => {
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

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        {
          startDate: '2023-05-16',
          startTime: '10:00',
          endTime: '14:30',
          applyTo: EditApplyTo.THIS_OCCURRENCE,
        } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the date and time for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })

    it('when changing the comment', async () => {
      req.session.editAppointmentJourney.comment = 'Updated comment'

      await service.edit(req, res, EditApplyTo.THIS_OCCURRENCE)

      expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        { comment: 'Updated comment', applyTo: EditApplyTo.THIS_OCCURRENCE } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the heads up for this appointment",
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
    })
  })
})
