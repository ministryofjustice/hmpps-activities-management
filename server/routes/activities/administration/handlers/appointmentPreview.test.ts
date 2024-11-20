import { Request, Response } from 'express'
import { addDays } from 'date-fns'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import AppointmentPreviewRoutes from './appointmentPreview'
import { AppointmentCountSummary } from '../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../jest.setup'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Change Regime times', () => {
  const handler = new AppointmentPreviewRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'RSI',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
      addValidationError: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render appointment preview page', async () => {
      const summary: AppointmentCountSummary[] = [
        {
          appointmentCategorySummary: {
            code: 'ACTI',
            description: 'Activities',
          },
          count: 15,
        },
        {
          appointmentCategorySummary: {
            code: 'OIC',
            description: 'Adjudication Hearing',
          },
          count: 0,
        },
        {
          appointmentCategorySummary: {
            code: 'CAREER',
            description: 'Careers Adviser Appointment',
          },
          count: 40,
        },
      ]

      const tomorrow = formatIsoDate(addDays(new Date(), 1))

      req.query = {
        fromDate: tomorrow,
        categories: 'ACTI,OIC,CAREER',
      }

      when(activitiesService.getAppointmentMigrationSummary)
        .calledWith(atLeast('RSI', tomorrow, 'ACTI,OIC,CAREER'))
        .mockResolvedValueOnce(summary)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/administration/appointment-preview', {
        appointmentMigrationSummaries: summary,
        fromDate: tomorrow,
        totalAppointments: 55,
        categories: 'ACTI,OIC,CAREER',
      })
    })
  })

  describe('POST', () => {
    it('should call the delete migration service the correctly and redirect successfully', async () => {
      const tomorrow = formatIsoDate(addDays(new Date(), 1))

      req.body = {
        fromDate: tomorrow,
        categories: 'ACTI,OIC',
      }

      await handler.POST(req, res)

      expect(activitiesService.deleteMigratedAppointments).toBeCalledTimes(2)

      expect(activitiesService.deleteMigratedAppointments).toHaveBeenCalledWith(
        'RSI',
        tomorrow,
        'ACTI',
        res.locals.user,
      )
      expect(activitiesService.deleteMigratedAppointments).toHaveBeenCalledWith('RSI', tomorrow, 'OIC', res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/admin',
        'Appointment deletion has started',
        'Wait up to 15 minutes, then use the appointments service to check the appointments have been deleted.If you have database access you can check the ‘job’ table for success or failure of the deletion along with start and end times.Failure messages will be recorded in Sentry and should be posted to the #activities-and-appointments-alerts slack channel',
      )
    })
  })
})
