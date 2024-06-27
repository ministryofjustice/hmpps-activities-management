import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import AttendanceRequired, { AttendanceRequiredForm } from './attendanceRequired'
import { YesNo } from '../../../../@types/activities'
import { CreateAnActivityJourney } from '../journey'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Attendance Required option', () => {
  const handler = new AttendanceRequired(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
      params: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/attendance-required')
    })
  })

  describe('POST', () => {
    describe('Create', () => {
      beforeEach(() => {
        req.params.mode = 'create'
      })

      it('should reset payment details if attendance is not required during create', async () => {
        req.body = {
          attendanceRequired: YesNo.NO,
        }

        await handler.POST(req, res)

        expect(req.session.createJourney.attendanceRequired).toEqual(false)
        expect(req.session.createJourney.paid).toBe(false)
        expect(req.session.createJourney.pay.length).toBe(0)
      })

      it('should navigate to qualification page if attendance is not required', async () => {
        req.body = {
          attendanceRequired: YesNo.NO,
        }

        await handler.POST(req, res)

        expect(req.session.createJourney.attendanceRequired).toEqual(false)
        expect(req.session.createJourney.paid).toBe(false)
        expect(req.session.createJourney.pay.length).toBe(0)
        expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
      })

      it('should navigate to pay option page if attendance is required', async () => {
        req.body = {
          attendanceRequired: YesNo.YES,
        }

        await handler.POST(req, res)

        expect(req.session.createJourney.attendanceRequired).toEqual(true)
        expect(req.session.createJourney.paid).toBe(undefined)
        expect(req.session.createJourney.pay).toBe(undefined)
        expect(res.redirectOrReturn).toHaveBeenCalledWith('pay-option')
      })
    })

    describe('Edit', () => {
      beforeEach(() => {
        req.params.mode = 'edit'
        req.session.createJourney = {
          activityId: 111,
          name: 'Maths level 1',
        } as unknown as CreateAnActivityJourney
      })

      it('should update the activity', async () => {
        req.body = {
          attendanceRequired: YesNo.YES,
        }

        const expectedActivityUpdateRequest = {
          attendanceRequired: true,
        } as ActivityUpdateRequest

        when(activitiesService.updateActivity)
          .calledWith(req.session.createJourney.activityId, expectedActivityUpdateRequest, res.locals.user)
          .mockResolvedValueOnce(activity as unknown as Activity)

        await handler.POST(req, res)

        expect(req.session.createJourney.attendanceRequired).toEqual(true)
        expect(activitiesService.updateActivity).toBeCalledWith(
          req.session.createJourney.activityId,
          expectedActivityUpdateRequest,
          res.locals.user,
        )
        expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
          '/activities/view/111',
          'Activity updated',
          "You've updated the record attendance option for Maths level 1",
        )
      })
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        attendanceRequired: '',
      }

      const requestObject = plainToInstance(AttendanceRequiredForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'attendanceRequired', error: 'Select yes if attendance should be recorded' }])
    })
  })
})
