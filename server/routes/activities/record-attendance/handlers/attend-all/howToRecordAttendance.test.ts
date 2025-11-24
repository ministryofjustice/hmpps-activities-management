import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import HowToRecordAttendanceRoutes, { HowToRecordAttendanceForm } from './howToRecordAttendance'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

describe('Route Handlers - How to record attendance', () => {
  const handler = new HowToRecordAttendanceRoutes()
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
        'pages/activities/record-attendance/attend-all/how-to-record-attendance',
        {},
      )
    })
  })

  describe('POST', () => {
    it('should redirect for ACTIVITY selection', async () => {
      req.body = { howToRecord: 'ACTIVITY' }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`choose-details-by-activity`)
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(HowToRecordAttendanceForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'howToRecord', error: 'Select how to record attendance' }])
    })

    it('passes validation', async () => {
      const body = {
        howToRecord: 'ACTIVITY',
      }

      const requestObject = plainToInstance(HowToRecordAttendanceForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
