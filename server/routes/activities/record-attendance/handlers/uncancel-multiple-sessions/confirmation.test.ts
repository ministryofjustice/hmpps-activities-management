import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { format } from 'date-fns'
import UncancelMultipleSessionsConfirmRoutes, { UncancelMultipleConfirmForm } from './confirmation'
import ActivitiesService from '../../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Uncancel Multiple Sessions Confirmation', () => {
  const handler = new UncancelMultipleSessionsConfirmRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      params: {
        id: '1',
      },
      session: {
        recordAttendanceJourney: {
          selectedInstanceIds: ['1'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render uncancel multiple session confirmation page - single selection', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '10:00',
          endTime: '11:00',
          activitySchedule: {
            activity: { summary: 'Maths level 1' },
            internalLocation: { description: 'Houseblock 1' },
          },
          attendances: [
            { prisonerNumber: 'ABC123', status: 'WAITING' },
            { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
            { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
          ],
        } as ScheduledActivity)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/uncancel-multiple-sessions/confirm-single',
        { activityName: 'Maths level 1' },
      )
    })

    it('should render uncancel multiple session confirmation page - multiple selection', async () => {
      req.session.recordAttendanceJourney.selectedInstanceIds = ['1', '2']

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/uncancel-multiple-sessions/confirm-multiple',
        { selectedInstanceIds: [1, 2] },
      )
    })
  })

  describe('POST', () => {
    let confirmRequest: Request

    beforeEach(() => {
      confirmRequest = {
        ...req,
        body: {
          confirm: 'yes',
        },
      } as unknown as Request
    })

    it('should uncancel scheduled activity', async () => {
      await handler.POST(confirmRequest, res)

      expect(activitiesService.uncancelMultipleActivities).toHaveBeenCalledWith([1], {
        username: 'joebloggs',
        firstName: 'Joe',
        lastName: 'Bloggs',
      })

      expect(res.redirect).toHaveBeenCalledWith('../uncancel-multiple')
    })

    it('should redirect back to uncancel activities list page if not confirmed', async () => {
      confirmRequest.body.confirm = 'no'
      await handler.POST(confirmRequest, res)

      expect(activitiesService.uncancelMultipleActivities).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('../uncancel-multiple')
    })
  })

  describe('Validation', () => {
    it('validation fails when confirmation value not selected - single selection', async () => {
      const body = {
        activityName: 'Maths level 1',
      }

      const requestObject = plainToInstance(UncancelMultipleConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'confirm', error: 'Select if you want to uncancel Maths level 1' }])
    })

    it('validation fails when confirmation value not selected - multiple selection', async () => {
      const body = {}

      const requestObject = plainToInstance(UncancelMultipleConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'confirm', error: 'Select if you want to uncancel the activity sessions' }])
    })

    it('validation should pass when valid confirmation option selected', async () => {
      const body = {
        confirm: 'yes',
      }

      const requestObject = plainToInstance(UncancelMultipleConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toHaveLength(0)
    })
  })
})
