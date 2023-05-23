import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import { formatDate } from './utils'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentApplyTo, AppointmentApplyToOption } from '../@types/appointments'
import { getAppointmentApplyToOptions } from './editAppointmentUtils'

describe('Edit Appointment Utils', () => {
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

  describe('get appointment apply to options', () => {
    it('future non repeating appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [1]
      req.session.editAppointmentJourney.sequenceNumber = 1

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (1 of 1)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('past non repeating appointment', () => {
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

    it('repeating appointment single remaining appointment', () => {
      req.session.editAppointmentJourney.sequenceNumbers = [4]
      req.session.editAppointmentJourney.sequenceNumber = 4

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (4 of 4)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment no remaining appointments', () => {
      req.session.editAppointmentJourney.sequenceNumbers = []
      req.session.editAppointmentJourney.sequenceNumber = 3

      expect(getAppointmentApplyToOptions(req)).toEqual([
        {
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
          description: `Just this one - ${weekTomorrowFormatted} (3 of 4)`,
        },
      ] as AppointmentApplyToOption[])
    })

    it('repeating appointment first appointment', () => {
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

    it('repeating appointment two remaining appointments first appointment', () => {
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

    it('repeating appointment deleted appointment first appointment', () => {
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

    it('repeating appointment second appointment', () => {
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

    it('repeating appointment second to last appointment', () => {
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

    it('repeating appointment last appointment', () => {
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
  })
})
