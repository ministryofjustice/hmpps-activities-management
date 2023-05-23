import { Request } from 'express'
import { addDays } from 'date-fns'
import { formatDate } from './utils'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentApplyTo, AppointmentApplyToOption, AppointmentCancellationReason } from '../@types/appointments'
import { getAppointmentApplyToOptions, isApplyToQuestionRequired } from './editAppointmentUtils'

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
          sequenceNumbers: [1, 2, 3, 4],
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

  describe('get appointment apply to options', () => {
    it('change future non repeating appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [1]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 1)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('change past non repeating appointment', () => {
      req.session.editAppointmentJourney.repeatCount = 1
      req.session.editAppointmentJourney.sequenceNumbers = []
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 1)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change single remaining appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [4]
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (4 of 4)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment no remaining appointments change past appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = []
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (3 of 4)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change first appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription: 'You’re changing appointments 1 to 4',
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment two remaining appointments change first appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [3, 4]
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (3 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription: 'You’re changing appointments 3 to 4',
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment deleted appointment change first appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [1, 3, 4]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription: 'You’re changing appointments 1 to 4',
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change second appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 2

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (2 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments that come after it in the series',
          additionalDescription: 'You’re changing appointments 2 to 4',
        },
        {
          applyTo: AppointmentApplyTo.ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments in the series that haven’t happened yet',
          additionalDescription: 'You’re changing appointments 1 to 4',
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change second to last appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (3 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
          description: 'This one and the appointment that comes after it in the series',
          additionalDescription: 'You’re changing appointments 3 to 4',
        },
        {
          applyTo: AppointmentApplyTo.ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments in the series that haven’t happened yet',
          additionalDescription: 'You’re changing appointments 1 to 4',
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment change last appointment', () => {
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (4 of 4)`,
        },
        {
          applyTo: AppointmentApplyTo.ALL_FUTURE_OCCURRENCES,
          description: 'This one and all the appointments in the series that haven’t happened yet',
          additionalDescription: 'You’re changing appointments 1 to 4',
        },
      ] as AppointmentApplyToOption[])
    })

    it('cancel appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual('You’re cancelling appointments 2 to 4')
      expect(options[2].additionalDescription).toEqual('You’re cancelling appointments 1 to 4')
    })

    it('delete appointment', () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR

      const options = getAppointmentApplyToOptions(req)

      expect(options[1].additionalDescription).toEqual('You’re deleting appointments 2 to 4')
      expect(options[2].additionalDescription).toEqual('You’re deleting appointments 1 to 4')
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

      expect(options[1].additionalDescription).toEqual('You’re adding this person to appointments 2 to 4')
      expect(options[2].additionalDescription).toEqual('You’re adding this person to appointments 1 to 4')
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

      expect(options[1].additionalDescription).toEqual('You’re adding these people to appointments 2 to 4')
      expect(options[2].additionalDescription).toEqual('You’re adding these people to appointments 1 to 4')
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

      expect(options[1].additionalDescription).toEqual('You’re removing this person from appointments 2 to 4')
      expect(options[2].additionalDescription).toEqual('You’re removing this person from appointments 1 to 4')
    })
  })

  describe('is apply to question required', () => {
    it('change future non repeating appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [1]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('change past non repeating appointment', () => {
      req.session.editAppointmentJourney.repeatCount = 1
      req.session.editAppointmentJourney.sequenceNumbers = []
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('repeating appointment change single remaining appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [4]
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('repeating appointment no remaining appointments change past appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = []
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(false)
    })

    it('repeating appointment two remaining appointments change first appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [3, 4]
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(true)
    })

    it('repeating appointment change appointment', () => {
      expect(isApplyToQuestionRequired(req.session.editAppointmentJourney)).toEqual(true)
    })
  })
})
