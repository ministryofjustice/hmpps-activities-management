import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import CancelSingleSessionPayRoutes, { SessionPaySingleForm } from './payment'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

describe('Route Handlers - Cancel Single Session Payment', () => {
  const handler = new CancelSingleSessionPayRoutes()

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        id: '1',
      },
      journeyData: {
        recordAttendanceJourney: {
          sessionCancellationSingle: {
            activityName: 'Kitchen tasks',
            issuePayment: false,
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/cancel-single-session/payment', {
        activityName: 'Kitchen tasks',
      })
    })
  })

  describe('POST', () => {
    it('redirect and option is saved as expected when the issue pay option is yes', async () => {
      req.body = {
        issuePayOption: 'yes',
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
      expect(req.journeyData.recordAttendanceJourney.sessionCancellationSingle.activityName).toEqual('Kitchen tasks')
      expect(req.journeyData.recordAttendanceJourney.sessionCancellationSingle.issuePayment).toEqual(true)
    })

    it('redirect and option is saved as expected when the issue pay option is no', async () => {
      req.body = {
        issuePayOption: 'no',
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
      expect(req.journeyData.recordAttendanceJourney.sessionCancellationSingle.activityName).toEqual('Kitchen tasks')
      expect(req.journeyData.recordAttendanceJourney.sessionCancellationSingle.issuePayment).toEqual(false)
    })
  })

  describe('Validation', () => {
    it('should pass validation when issue pay option is set to "no"', async () => {
      const body = {
        issuePayOption: 'no',
      }

      const requestObject = plainToInstance(SessionPaySingleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should pass validation when issue pay option is set to "yes"', async () => {
      const body = {
        issuePayOption: 'yes',
      }

      const requestObject = plainToInstance(SessionPaySingleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation when issue pay option not provided', async () => {
      const body = {}

      const requestObject = plainToInstance(SessionPaySingleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select if people should be paid for this cancelled session',
            property: 'issuePayOption',
          },
        ]),
      )
    })
  })
})
