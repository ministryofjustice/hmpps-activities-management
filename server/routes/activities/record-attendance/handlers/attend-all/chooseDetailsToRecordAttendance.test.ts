import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import ChooseDetailsToRecordAttendanceRoutes, {
  ChooseDetailsToRecordAttendanceForm,
} from './chooseDetailsToRecordAttendance'
import ActivitiesService from '../../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Choose details to record attendance', () => {
  const handler = new ChooseDetailsToRecordAttendanceRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/choose-details-to-record-attendance',
        {},
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {
        datePresetOption: '',
        timePeriod: '',
        activityId: '',
      }

      const requestObject = plainToInstance(ChooseDetailsToRecordAttendanceForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select a date' },
        { property: 'timePeriod', error: 'Select a time period' },
        { property: 'activityId', error: 'Enter an activity name and select it from the list' },
      ])
    })

    it('validation fails for conditional values', async () => {
      const body = {
        datePresetOption: 'other',
        timePeriod: 'PM',
        activityId: '1',
      }

      const requestObject = plainToInstance(ChooseDetailsToRecordAttendanceForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails for future date values', async () => {
      const body = {
        datePresetOption: 'other',
        date: format(addDays(new Date(), 61), 'dd/MM/yyyy'),
        timePeriod: 'PM',
        activityId: '1',
      }

      const requestObject = plainToInstance(ChooseDetailsToRecordAttendanceForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'today',
        timePeriod: 'AM',
        activityId: '1',
      }

      const requestObject = plainToInstance(ChooseDetailsToRecordAttendanceForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
