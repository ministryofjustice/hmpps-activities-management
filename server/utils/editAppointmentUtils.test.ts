import { Request } from 'express'
import { addDays } from 'date-fns'
import { formatDate, parseDate } from './utils'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import {
  AppointmentApplyTo,
  AppointmentApplyToOption,
  AppointmentCancellationReason,
  AppointmentFrequency,
} from '../@types/appointments'
import {
  getAppointmentApplyToOptions,
  getAppointmentEditMessage,
  getAppointmentBackLinkHref,
  isApplyToQuestionRequired,
  getRepeatFrequencyText,
  getConfirmAppointmentEditCta,
  getAppointmentEditApplyToCta,
} from './editAppointmentUtils'

describe('Edit Appointment Utils', () => {
  const weekTomorrow = addDays(new Date(), 8)
  const weekTomorrowFormatted = formatDate(weekTomorrow, 'EEEE, d MMMM yyyy')
  let req: Request
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
          numberOfAppointments: 4,
          appointments: [
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
            {
              sequenceNumber: 4,
              startDate: '2023-01-04',
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAppointmentBackLinkHref', () => {
    it('create mode', () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
      expect(getAppointmentBackLinkHref(req, 'name')).toEqual('name')
    })

    it('edit mode null appointment id', () => {
      req.params.appointmentId = null
      expect(getAppointmentBackLinkHref(req, 'name')).toEqual('name')
    })

    it('edit mode null occurrence id', () => {
      req.params.occurrenceId = null
      expect(getAppointmentBackLinkHref(req, 'name')).toEqual('name')
    })

    it('edit', () => {
      expect(getAppointmentBackLinkHref(req, 'name')).toEqual(
        `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
      )
    })
  })

  describe('is apply to question required', () => {
    it('change future non repeating appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 1,
          startDate: '2023-01-01',
        },
      ]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('change past non repeating appointment', () => {
      req.session.editAppointmentJourney.numberOfAppointments = 1
      req.session.editAppointmentJourney.appointments = []
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('repeating appointment change single remaining appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 4,
          startDate: '2023-01-01',
        },
      ]
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('repeating appointment no remaining appointments change past appointment', () => {
      req.session.editAppointmentJourney.appointments = []
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('repeating appointment two remaining appointments change first appointment', () => {
      req.session.editAppointmentJourney.appointments = [
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

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(true)
    })

    it('repeating appointment change appointment', () => {
      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(true)
    })
  })

  describe('get appointment edit message', () => {
    it('when cancelling an appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'cancel',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Cancel appointment',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Confirm',
      )
    })

    it('when deleting an appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'delete',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Delete appointment',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Confirm',
      )
    })

    it('when changing the location', () => {
      req.session.editAppointmentJourney.location = {
        id: 2,
        description: 'Updated location',
      }

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the location for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update location',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update location',
      )
    })

    it('when changing the start date', () => {
      req.session.editAppointmentJourney.startDate = {
        day: 16,
        month: 5,
        year: 2023,
        date: parseDate('2023-05-16'),
      }

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the date for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date',
      )
    })

    it('when changing the start time', () => {
      req.session.editAppointmentJourney.startTime = {
        hour: 10,
        minute: 0,
        date: parseDate('2023-05-15T10:00', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
    })

    it('when changing the end time', () => {
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
    })

    it('when changing the end time from null', () => {
      req.session.appointmentJourney.endTime = null
      req.session.editAppointmentJourney.endTime = {
        hour: 14,
        minute: 30,
        date: parseDate('2023-05-15T14:30', "yyyy-MM-dd'T'HH:mm"),
      }

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
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

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update time',
      )
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

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the date and time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date and time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date and time',
      )
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

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the date and time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date and time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date and time',
      )
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

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the date and time for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date and time',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update date and time',
      )
    })

    it('when changing the comment', () => {
      req.session.editAppointmentJourney.extraInformation = 'Updated comment'

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the extra information for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update extra information',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update extra information',
      )
    })

    it('when removing the comment', () => {
      req.session.editAppointmentJourney.extraInformation = ''

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the extra information for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update extra information',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update extra information',
      )
    })

    it('when adding one person', () => {
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST PRISONER',
          cellLocation: '1-1-1',
        },
      ]

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'add Test Prisoner to',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Confirm',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Confirm',
      )
    })

    it('when adding two people', () => {
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST PRISONER1',
          cellLocation: '1-1-1',
        },
        {
          number: 'B2345CD',
          name: 'TEST PRISONER2',
          cellLocation: '1-1-1',
        },
      ]

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'add these people to',
      )
    })

    it('when removing a person', () => {
      req.session.editAppointmentJourney.removePrisoner = {
        prisonerNumber: 'A1234BC',
        bookingId: 1,
        firstName: 'TEST',
        lastName: 'PRISONER',
        prisonCode: 'MDI',
        cellLocation: '1-1-1',
      }

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'remove Test Prisoner from',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Confirm removal',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Confirm',
      )
    })
  })

  describe('get appointment apply to options', () => {
    it('change future non repeating appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 1,
          startDate: '2023-01-01',
        },
      ]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 1)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change single remaining appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 4,
          startDate: '2023-01-01',
        },
      ]
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (4 of 4)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change first appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription:
            "You're changing the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment two remaining appointments change first appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 3,
          startDate: '2023-01-03',
        },
        {
          sequenceNumber: 4,
          startDate: '2023-01-04',
        },
      ]
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (3 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription:
            "You're changing the following 2 appointments:<br>3 January 2023 (3 of 4) to 4 January 2023 (4 of 4)",
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment deleted appointment change first appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 1,
          startDate: '2023-01-01',
        },
        {
          sequenceNumber: 3,
          startDate: '2023-01-03',
        },
        {
          sequenceNumber: 4,
          startDate: '2023-01-04',
        },
      ]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription:
            "You're changing the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change second appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 2

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (2 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription:
            "You're changing the following 3 appointments:<br>2 January 2023 (2 of 4) to 4 January 2023 (4 of 4)",
        },
        {
          applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          description: "This one and all the appointments in the series that haven't happened yet",
          additionalDescription:
            "You're changing the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change second to last appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (3 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: 'This one and the appointment that comes after it in the series',
          additionalDescription:
            "You're changing the following 2 appointments:<br>3 January 2023 (3 of 4) to 4 January 2023 (4 of 4)",
        },
        {
          applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          description: "This one and all the appointments in the series that haven't happened yet",
          additionalDescription:
            "You're changing the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change last appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
          description: `Just this one - ${weekTomorrowFormatted} (4 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          description: "This one and all the appointments in the series that haven't happened yet",
          additionalDescription:
            "You're changing the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
        },
      ] as AppointmentApplyToOption[])
    })

    it('cancel appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual(
        "You're cancelling the following 3 appointments:<br>2 January 2023 (2 of 4) to 4 January 2023 (4 of 4)",
      )
      expect(options[2].additionalDescription).toEqual(
        "You're cancelling the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
      )
    })

    it('delete appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual(
        "You're deleting the following 3 appointments:<br>2 January 2023 (2 of 4) to 4 January 2023 (4 of 4)",
      )
      expect(options[2].additionalDescription).toEqual(
        "You're deleting the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
      )
    })

    it('add one person to the appointment', () => {
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST PRISONER',
          cellLocation: '1-1-1',
        },
      ]

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual(
        "You're adding this person to the following 3 appointments:<br>2 January 2023 (2 of 4) to 4 January 2023 (4 of 4)",
      )
      expect(options[2].additionalDescription).toEqual(
        "You're adding this person to the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
      )
    })

    it('add two people to the appointment', () => {
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST PRISONER1',
          cellLocation: '1-1-1',
        },
        {
          number: 'B2345CD',
          name: 'TEST PRISONER2',
          cellLocation: '1-1-1',
        },
      ]

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual(
        "You're adding these people to the following 3 appointments:<br>2 January 2023 (2 of 4) to 4 January 2023 (4 of 4)",
      )
      expect(options[2].additionalDescription).toEqual(
        "You're adding these people to the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
      )
    })

    it('remove a person from the appointment', () => {
      req.session.editAppointmentJourney.removePrisoner = {
        prisonerNumber: 'A1234BC',
        bookingId: 1,
        firstName: 'TEST',
        lastName: 'PRISONER',
        prisonCode: 'MDI',
        cellLocation: '1-1-1',
      }

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual(
        "You're removing this person from the following 3 appointments:<br>2 January 2023 (2 of 4) to 4 January 2023 (4 of 4)",
      )
      expect(options[2].additionalDescription).toEqual(
        "You're removing this person from the following 4 appointments:<br>1 January 2023 (1 of 4) to 4 January 2023 (4 of 4)",
      )
    })
  })

  describe('appointment frequency text', () => {
    it.each([
      ['null', null, null],
      ['week day', AppointmentFrequency.WEEKDAY, 'week day'],
      ['day', AppointmentFrequency.DAILY, 'day'],
      ['week', AppointmentFrequency.WEEKLY, 'week'],
      ['fortnight', AppointmentFrequency.FORTNIGHTLY, 'fortnight'],
      ['month', AppointmentFrequency.MONTHLY, 'month'],
      ['unknown value', 'UNKNOWN', null],
    ])(
      'should return correct frequency text for %s',
      (_: string, repeatPeriod: AppointmentFrequency, expectedFrequencyNoun: string) => {
        req.session.appointmentJourney = {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          frequency: repeatPeriod,
        }

        const expectedText = expectedFrequencyNoun ? `This appointment repeats every ${expectedFrequencyNoun}` : null
        expect(getRepeatFrequencyText(req.session.appointmentJourney)).toEqual(expectedText)
      },
    )
  })
})
