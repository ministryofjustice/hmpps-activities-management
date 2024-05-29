import { Request, Response } from 'express'
import Uncancel from './uncancel'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentApplyTo } from '../../../../@types/appointments'

jest.mock('../../../../services/editAppointmentService')
const editAppointmentService = new EditAppointmentService(null, null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Uncancel an Appointment', () => {
  const handler = new Uncancel(editAppointmentService)

  let req: Request
  let res: Response
  const appointmentId = 2
  const property = 'location'

  beforeEach(() => {
    req = {
      session: {
        appointmentJourney: {
          mode: 'EDIT',
          type: 'GROUP',
          appointmentName: 'Activities',
          prisoners: [
            {
              number: 'G6268GL',
              name: 'DUPTCELSE ABBYN',
              prisonCode: 'RSI',
              status: 'ACTIVE OUT',
              cellLocation: 'C-3-13N',
              category: 'C',
            },
          ],
          category: {
            code: 'ACTI',
            description: 'Activities',
          },
          tierCode: 'FOUNDATION',
          organiserCode: null,
          location: {
            id: 67128,
            prisonCode: 'RSI',
            description: 'A Wing',
          },
          inCell: false,
          startDate: '2024-05-29',
          startTime: {
            date: '2024-05-29T03:00:00.000Z',
            hour: 4,
            minute: 0,
          },
          endTime: {
            date: '2024-05-29T04:00:00.000Z',
            hour: 5,
            minute: 0,
          },
          repeat: 'NO',
          extraInformation: null,
        },
        editAppointmentJourney: {
          numberOfAppointments: 1,
          appointments: [
            {
              sequenceNumber: 1,
              startDate: '2024-05-29',
            },
          ],
          sequenceNumber: 1,
          appointmentSeries: {
            id: 22,
            schedule: null,
            appointmentCount: 1,
            scheduledAppointmentCount: 0,
          },
          appointmentSet: null,
          uncancel: true,
        } as EditAppointmentJourney,
      },
      params: {
        appointmentId,
        property,
      },
    } as unknown as Request

    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('should render correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirm-edit', {
        appointmentId,
        startDate: parseIsoDate(req.session.appointmentJourney.startDate),
        editMessage: 'uncancel',
      })
    })
  })

  describe('POST', () => {
    it('should redirect to apply-to screen when part of an appointment series', async () => {
      req = {
        session: {
          appointmentJourney: {
            mode: 'EDIT',
            type: 'GROUP',
            appointmentName: 'Activities',
            prisoners: [
              {
                number: 'G7274UH',
                name: 'EFLIAICO GABRIJAH',
                prisonCode: 'RSI',
                status: 'ACTIVE IN',
                cellLocation: 'R-2-037',
                category: 'C',
              },
            ],
            category: {
              code: 'ACTI',
              description: 'Activities',
            },
            tierCode: 'FOUNDATION',
            organiserCode: null,
            location: {
              id: 67128,
              prisonCode: 'RSI',
              description: 'A Wing',
            },
            inCell: false,
            startDate: '2024-05-29',
            startTime: {
              date: '2024-05-29T08:00:00.000Z',
              hour: 9,
              minute: 0,
            },
            endTime: {
              date: '2024-05-29T08:20:00.000Z',
              hour: 9,
              minute: 20,
            },
            repeat: 'YES',
            frequency: 'WEEKDAY',
            numberOfAppointments: 5,
            extraInformation: null,
          },
          editAppointmentJourney: {
            numberOfAppointments: 5,
            appointments: [
              {
                sequenceNumber: 1,
                startDate: '2024-05-29',
              },
              {
                sequenceNumber: 2,
                startDate: '2024-05-30',
              },
              {
                sequenceNumber: 3,
                startDate: '2024-05-31',
              },
              {
                sequenceNumber: 4,
                startDate: '2024-06-03',
              },
              {
                sequenceNumber: 5,
                startDate: '2024-06-04',
              },
            ],
            sequenceNumber: 1,
            appointmentSeries: {
              id: 21,
              schedule: {
                frequency: 'WEEKDAY',
                numberOfAppointments: 5,
              },
              appointmentCount: 5,
              scheduledAppointmentCount: 5,
            },
            appointmentSet: null,
            uncancel: true,
          } as EditAppointmentJourney,
        },
        params: {
          appointmentId,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toBeCalledWith('apply-to')
    })

    it('should redirect to appointment screen when a single appointment', async () => {
      req = {
        session: {
          appointmentJourney: {
            mode: 'EDIT',
            type: 'GROUP',
            appointmentName: 'Activities',
            prisoners: [
              {
                number: 'G6268GL',
                name: 'DUPTCELSE ABBYN',
                prisonCode: 'RSI',
                status: 'ACTIVE OUT',
                cellLocation: 'C-3-13N',
                category: 'C',
              },
            ],
            category: {
              code: 'ACTI',
              description: 'Activities',
            },
            tierCode: 'FOUNDATION',
            organiserCode: null,
            location: {
              id: 67128,
              prisonCode: 'RSI',
              description: 'A Wing',
            },
            inCell: false,
            startDate: '2024-05-29',
            startTime: {
              date: '2024-05-29T03:00:00.000Z',
              hour: 4,
              minute: 0,
            },
            endTime: {
              date: '2024-05-29T04:00:00.000Z',
              hour: 5,
              minute: 0,
            },
            repeat: 'NO',
            extraInformation: null,
          },
          editAppointmentJourney: {
            numberOfAppointments: 1,
            appointments: [
              {
                sequenceNumber: 1,
                startDate: '2024-05-29',
              },
            ],
            sequenceNumber: 1,
            appointmentSeries: {
              id: 22,
              schedule: null,
              appointmentCount: 1,
              scheduledAppointmentCount: 0,
            },
            appointmentSet: null,
            uncancel: true,
          } as EditAppointmentJourney,
        },
        params: {
          appointmentId,
          property,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    })
  })
})
