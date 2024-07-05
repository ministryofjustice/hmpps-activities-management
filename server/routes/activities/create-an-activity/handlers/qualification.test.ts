import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import QualificationRoutes, { Qualification } from './qualifications'

describe('Route Handlers - Create an activity - Qualifications', () => {
  const handler = new QualificationRoutes()
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
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/qualification')
    })
  })

  describe('POST', () => {
    it('Yes: should save the selected qualification option in session and redirect to the education level page', async () => {
      req.body = {
        qualificationOption: 'yes',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.qualificationOption).toEqual('yes')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('education-level')
    })

    it('No: should save the selected qualification option in session and redirect to the check answers page', async () => {
      req.body = {
        qualificationOption: 'no',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.qualificationOption).toEqual('no')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('start-date')
    })
  })

  describe('qualification validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(Qualification, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'qualificationOption', error: 'Select yes if education levels or qualifications are required' },
      ])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        qualificationOption: 'bad',
      }

      const requestObject = plainToInstance(Qualification, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'qualificationOption', error: 'Select yes if education levels or qualifications are required' },
      ])
    })

    it('passes validation', async () => {
      const body = {
        qualificationOption: 'yes',
      }

      const requestObject = plainToInstance(Qualification, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
