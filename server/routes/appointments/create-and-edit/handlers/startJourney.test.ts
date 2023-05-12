import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import StartJourneyRoutes from './startJourney'
import { AppointmentDetails, AppointmentOccurrenceDetails } from '../../../../@types/activitiesAPI/types'
import { parseDate } from '../../../../utils/utils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { YesNo } from '../../../../@types/activities'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Start', () => {
  const handler = new StartJourneyRoutes(new EditAppointmentService(activitiesService))
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
    } as unknown as Request
  })

  describe('INDIVIDUAL', () => {
    it('should populate the session with individual appointment journey type and redirect to select prisoner page', async () => {
      await handler.INDIVIDUAL(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.INDIVIDUAL,
      })
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner')
    })
  })

  describe('GROUP', () => {
    it('should populate the session with group appointment journey type and redirect to how to add prisoners page', async () => {
      await handler.GROUP(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        prisoners: [],
      })
      expect(res.redirect).toHaveBeenCalledWith('how-to-add-prisoners')
    })
  })

  describe('EDIT_OCCURRENCE', () => {
    it('should populate the session with appointment occurrence details redirect to the correct edit route', async () => {
      req.params = {
        property: 'location',
      }
      req.appointment = {
        occurrences: [
          {
            id: 12,
            sequenceNumber: 2,
          },
          {
            id: 13,
            sequenceNumber: 3,
          },
        ],
      } as unknown as AppointmentDetails
      req.appointmentOccurrence = {
        id: 12,
        appointmentId: 2,
        appointmentType: 'GROUP',
        sequenceNumber: 2,
        category: {
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        internalLocation: {
          id: 26152,
          prisonCode: 'CHAP',
          description: 'Chapel',
        },
        startDate: '2023-04-13',
        startTime: '09:00',
        endTime: '10:00',
        repeat: {
          period: 'WEEKLY',
          count: 3,
        },
        prisoners: [
          {
            prisonerNumber: 'A1234BC',
            firstName: 'TEST01',
            lastName: 'PRISONER01',
            cellLocation: '1-1-1',
          },
        ],
      } as AppointmentOccurrenceDetails

      const appointmentJourneySession = {
        mode: AppointmentJourneyMode.EDIT,
        type: AppointmentType.GROUP,
        prisoners: [
          {
            number: 'A1234BC',
            name: 'TEST01 PRISONER01',
            cellLocation: '1-1-1',
          },
        ],
        category: {
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        location: {
          id: 26152,
          prisonCode: 'CHAP',
          description: 'Chapel',
        },
        startDate: {
          date: parseDate('2023-04-13'),
          day: 13,
          month: 4,
          year: 2023,
        },
        startTime: {
          date: new Date('2023-04-13 09:00:00'),
          hour: 9,
          minute: 0,
        },
        endTime: {
          date: new Date('2023-04-13 10:00:00'),
          hour: 10,
          minute: 0,
        },
        repeat: YesNo.YES,
        repeatCount: 3,
        repeatPeriod: 'WEEKLY',
      } as AppointmentJourney

      const editAppointmentJourneySession = {
        repeatCount: 3,
        occurrencesRemaining: 2,
        sequenceNumber: 2,
      } as EditAppointmentJourney

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney).toEqual(appointmentJourneySession)
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(res.redirect).toHaveBeenCalledWith(`/appointments/2/occurrence/12/edit/location`)
    })

    it('should redirect back if property not specified', async () => {
      req.params = {
        property: '',
      }

      await handler.EDIT(req, res)

      expect(res.redirect).toHaveBeenCalledWith('back')
    })
  })
})
