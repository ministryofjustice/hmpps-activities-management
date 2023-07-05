import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import ActivitiesService from './activitiesService'
import EditAppointmentService from './editAppointmentService'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason, AppointmentApplyTo } from '../@types/appointments'
import { formatDate, parseDate } from '../utils/utils'
import { AppointmentOccurrenceCancelRequest, AppointmentOccurrenceUpdateRequest } from '../@types/activitiesAPI/types'
import { YesNo } from '../@types/activities'

jest.mock('./activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Edit Appointment Service', () => {
  const service = new EditAppointmentService(activitiesService)
  const weekTomorrow = addDays(new Date(), 8)
  const weekTomorrowFormatted = formatDate(weekTomorrow, 'EEEE, d MMMM yyyy')
  let req: Request
  let res: Response
  const appointmentId = 1
  const occurrenceId = 2

  beforeEach(() => {
    req = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          category: {
            code: 'TEST',
            description: 'Category',
          },
          location: {
            id: 1,
            description: 'Location',
          },
          startDate: {
            day: weekTomorrow.getDate(),
            month: weekTomorrow.getMonth() + 1,
            year: weekTomorrow.getFullYear(),
            date: weekTomorrow,
          },
          startTime: {
            hour: 9,
            minute: 30,
            date: weekTomorrow.setHours(9, 30),
          },
          endTime: {
            hour: 13,
            minute: 0,
            date: weekTomorrow.setHours(13, 0),
          },
        } as unknown as AppointmentJourney,
        editAppointmentJourney: {
          repeatCount: 4,
          occurrences: [
            {
              sequenceNumber: 1,
              startDate: formatDate(weekTomorrow, 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 2,
              startDate: formatDate(addDays(weekTomorrow, 1), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 3,
              startDate: formatDate(addDays(weekTomorrow, 2), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 4,
              startDate: formatDate(addDays(weekTomorrow, 3), 'yyyy-MM-dd'),
            },
          ],
          sequenceNumber: 2,
        } as EditAppointmentJourney,
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

  describe('redirectOrEdit', () => {
    it('when no property has changed', async () => {
      await service.redirectOrEdit(req, res, '')

      expect(activitiesService.editAppointmentOccurrence).not.toHaveBeenCalled()
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
    })

    it('when changing the location for a non repeating appointment', async () => {
      req.session.editAppointmentJourney.occurrences = [
        {
          sequenceNumber: 1,
          startDate: formatDate(weekTomorrow, 'yyyy-MM-dd'),
        },
      ]
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      await service.redirectOrEdit(req, res, 'location')

      expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
        2,
        { internalLocationId: 2, applyTo: AppointmentApplyTo.THIS_OCCURRENCE } as AppointmentOccurrenceUpdateRequest,
        res.locals.user,
      )
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.editAppointmentJourney).toBeNull()
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        "You've changed the location for this appointment",
      )
    })

    it('when changing the location for a repeating appointment', async () => {
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      await service.redirectOrEdit(req, res, 'location')

      expect(activitiesService.editAppointmentOccurrence).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/location/apply-to`,
      )
      expect(req.session.appointmentJourney).not.toBeNull()
      expect(req.session.editAppointmentJourney).not.toBeNull()
    })
  })

  describe('edit', () => {
    describe('apply to this occurrence', () => {
      it('when cancelling', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            cancellationReasonId: +AppointmentCancellationReason.CANCELLED,
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

      it('when deleting', async () => {
        req.session.appointmentJourney.repeat = YesNo.NO
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            cancellationReasonId: +AppointmentCancellationReason.CREATED_IN_ERROR,
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          } as AppointmentOccurrenceCancelRequest,
          res.locals.user,
        )
        expect(activitiesService.editAppointmentOccurrence).not.toHaveBeenCalled()
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments`,
          `You've deleted the Category appointment - ${weekTomorrowFormatted}`,
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
      })

      it('when changing the location', async () => {
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          { internalLocationId: 2, applyTo: AppointmentApplyTo.THIS_OCCURRENCE } as AppointmentOccurrenceUpdateRequest,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          } as AppointmentOccurrenceUpdateRequest,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            startTime: '10:00',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            startTime: '10:00',
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            startTime: '10:00',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            startDate: '2023-05-16',
            startTime: '10:00',
            endTime: '14:30',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
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

        await service.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)

        expect(activitiesService.cancelAppointmentOccurrence).not.toHaveBeenCalled()
        expect(activitiesService.editAppointmentOccurrence).toHaveBeenCalledWith(
          2,
          {
            comment: 'Updated comment',
            applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          } as AppointmentOccurrenceUpdateRequest,
          res.locals.user,
        )
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've changed the extra information for this appointment",
        )
        expect(req.session.appointmentJourney).toBeNull()
        expect(req.session.editAppointmentJourney).toBeNull()
      })
    })

    describe('apply to this and all future occurrence', () => {
      it('when cancelling', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've cancelled appointments 2 to 4 in the series",
        )
      })

      it('when deleting', async () => {
        req.session.appointmentJourney.repeat = YesNo.YES
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've deleted appointments 2 to 4 in this series",
        )
      })

      it('when changing the location', async () => {
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've changed the location for appointments 2 to 4 in the series",
        )
      })

      it('when changing the location deleted last appointment', async () => {
        req.session.editAppointmentJourney.occurrences = [
          {
            sequenceNumber: 1,
            startDate: '2023-01-01',
          },
          {
            sequenceNumber: 2,
            startDate: '2023-01-02',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-01-03',
          },
        ]
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've changed the location for appointments 2 to 3 in the series",
        )
      })
    })

    describe('apply to all future occurrence', () => {
      it('when cancelling', async () => {
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've cancelled appointments 1 to 4 in the series",
        )
      })

      it('when deleting', async () => {
        req.session.appointmentJourney.repeat = YesNo.YES
        req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}`,
          "You've deleted appointments 1 to 4 in this series",
        )
      })

      it('when changing the location', async () => {
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've changed the location for appointments 1 to 4 in the series",
        )
      })

      it('when changing the location two remaining appointments', async () => {
        req.session.editAppointmentJourney.occurrences = [
          {
            sequenceNumber: 3,
            startDate: '2023-01-01',
          },
          {
            sequenceNumber: 4,
            startDate: '2023-01-02',
          },
        ]
        req.session.editAppointmentJourney.sequenceNumber = 3
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've changed the location for appointments 3 to 4 in the series",
        )
      })

      it('when changing the location deleted last appointment', async () => {
        req.session.editAppointmentJourney.occurrences = [
          {
            sequenceNumber: 1,
            startDate: '2023-01-01',
          },
          {
            sequenceNumber: 2,
            startDate: '2023-01-02',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-01-03',
          },
        ]
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }

        await service.edit(req, res, AppointmentApplyTo.ALL_FUTURE_OCCURRENCES)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
          "You've changed the location for appointments 1 to 3 in the series",
        )
      })
    })
  })
})
