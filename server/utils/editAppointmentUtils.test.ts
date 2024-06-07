import { Request } from 'express'
import { addDays, subDays } from 'date-fns'
import { formatDate, parseDate, toDateString } from './utils'
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
  isApplyToQuestionRequired,
  getRepeatFrequencyText,
  getConfirmAppointmentEditCta,
  getAppointmentEditApplyToCta,
  hasAppointmentLocationChanged,
  isUncancellable,
} from './editAppointmentUtils'
import { formatIsoDate } from './datePickerUtils'
import EventTier from '../enum/eventTiers'
import EventOrganiser from '../enum/eventOrganisers'
import { AppointmentDetails } from '../@types/activitiesAPI/types'

describe('Edit Appointment Utils', () => {
  const weekTomorrow = addDays(new Date(), 8)
  const weekTomorrowFormatted = formatDate(weekTomorrow, 'EEEE, d MMMM yyyy')
  let req: Request
  const appointmentId = 2

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
          tierCode: EventTier.TIER_1,
          location: {
            id: 1,
            description: 'Location',
          },
          startDate: formatIsoDate(weekTomorrow),
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
          location: {
            id: 1,
            description: 'Location',
          },
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
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('is apply to question required', () => {
    it('change future non repeating appointment', () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 1,
          startDate: '2023-01-01',
          cancelled: false,
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
          cancelled: false,
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
          cancelled: false,
        },
        {
          sequenceNumber: 4,
          startDate: '2023-01-02',
          cancelled: false,
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
        'Confirm',
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

    it('when changing the tier', () => {
      req.session.editAppointmentJourney.tierCode = EventTier.FOUNDATION

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the tier for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update tier',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update tier',
      )
    })

    it('when changing the host', () => {
      req.session.editAppointmentJourney.organiserCode = EventOrganiser.PRISONER

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the host for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update host',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update host',
      )
    })

    it('when changing the tier and host', () => {
      req.session.editAppointmentJourney.tierCode = EventTier.TIER_2
      req.session.editAppointmentJourney.organiserCode = EventOrganiser.PRISONER

      expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'change the tier and host for',
      )
      expect(getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update tier and host',
      )
      expect(getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
        'Update tier and host',
      )
    })

    describe('when changing for location messages', () => {
      beforeEach(() => {
        req.session.editAppointmentJourney.location = {
          id: 2,
          description: 'Updated location',
        }
      })

      it('then the appointment edit message contains the location change ', () => {
        expect(getAppointmentEditMessage(req.session.appointmentJourney, req.session.editAppointmentJourney)).toEqual(
          'change the location for',
        )
      })

      it('then the confirm appointment edit cta contains the location change ', () => {
        expect(
          getConfirmAppointmentEditCta(req.session.appointmentJourney, req.session.editAppointmentJourney),
        ).toEqual('Update location')
      })

      it('then the get appointment edit apply to cta contains the location change ', () => {
        expect(
          getAppointmentEditApplyToCta(req.session.appointmentJourney, req.session.editAppointmentJourney),
        ).toEqual('Update location')
      })
    })

    describe('when checking for location changes', () => {
      it.each([
        ['location id changes to in cell', { id: 1 }, undefined, false, true, true],
        ['location id remains unchanged', { id: 1 }, { id: 1 }, true, false, false],
        ['location changes from in cell to id', undefined, { id: 1 }, true, false, true],
        ['location remains in cell', undefined, undefined, true, true, false],
        ['location remains unchanged', undefined, undefined, undefined, undefined, false],
      ])('%s', (_, oldLocation, newLocation, oldInCell, newInCell, expected) => {
        req.session.appointmentJourney.location = !oldLocation ? undefined : { ...oldLocation, description: '' }
        req.session.editAppointmentJourney.location = !newLocation ? undefined : { ...newLocation, description: '' }
        req.session.appointmentJourney.inCell = oldInCell
        req.session.editAppointmentJourney.inCell = newInCell

        expect(hasAppointmentLocationChanged(req.session.appointmentJourney, req.session.editAppointmentJourney)).toBe(
          expected,
        )
      })
    })

    it('when changing the start date', () => {
      req.session.editAppointmentJourney.startDate = '2023-05-16'

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
      req.session.editAppointmentJourney.startDate = '2023-05-16'
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
      req.session.editAppointmentJourney.startDate = '2023-05-16'
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
      req.session.editAppointmentJourney.startDate = '2023-05-16'
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
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
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
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
        {
          number: 'B2345CD',
          name: 'TEST PRISONER2',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
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
        status: 'ACTIVE IN',
        category: 'H',
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
          cancelled: false,
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
          cancelled: false,
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
          cancelled: false,
        },
        {
          sequenceNumber: 4,
          startDate: '2023-01-04',
          cancelled: false,
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
          cancelled: false,
        },
        {
          sequenceNumber: 3,
          startDate: '2023-01-03',
          cancelled: false,
        },
        {
          sequenceNumber: 4,
          startDate: '2023-01-04',
          cancelled: false,
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
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
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
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
        {
          number: 'B2345CD',
          name: 'TEST PRISONER2',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
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
        cellLocation: '1-1-1',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
        category: 'H',
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
      ['week day', AppointmentFrequency.WEEKDAY, 'weekday (Monday to Friday)'],
      ['day', AppointmentFrequency.DAILY, 'day'],
      ['week', AppointmentFrequency.WEEKLY, 'week'],
      ['fortnight', AppointmentFrequency.FORTNIGHTLY, 'fortnight'],
      ['month', AppointmentFrequency.MONTHLY, 'month'],
      ['unknown value', 'UNKNOWN', null],
    ])(
      'should return correct frequency text for %s',
      (_: string, frequency: AppointmentFrequency, expectedFrequencyNoun: string) => {
        req.session.appointmentJourney = {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          frequency,
        }

        const expectedText = expectedFrequencyNoun ? `This appointment repeats every ${expectedFrequencyNoun}` : null
        expect(getRepeatFrequencyText(req.session.appointmentJourney)).toEqual(expectedText)
      },
    )
  })

  describe('uncancellable appointments', () => {
    const appointment = {
      id: 10,
      appointmentSeries: {
        id: 9,
      },
      startTime: '23:59',
      createdBy: 'joebloggs',
      updatedBy: 'joebloggs',
      cancelledBy: 'joebloggs',
      isCancelled: true,
    } as AppointmentDetails

    it('appointment cancelled 5 days ago can be uncancelled', async () => {
      appointment.startDate = toDateString(subDays(new Date(), 5))

      const canCancel: boolean = isUncancellable(appointment)

      expect(canCancel).toEqual(true)
    })

    it('appointment cancelled 6 days ago can be cannot be uncancelled', async () => {
      appointment.startDate = toDateString(subDays(new Date(), 6))

      const canCancel: boolean = isUncancellable(appointment)

      expect(canCancel).toEqual(false)
    })
  })
})
