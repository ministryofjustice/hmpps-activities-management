import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import WhoPaysRoutes, { WhoPays } from './whoPays'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create an activity - Who Pays', () => {
  const handler = new WhoPaysRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      body: {},
      journeyData: {
        createJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the who-pays page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/who-pays')
    })
  })

  describe('POST', () => {
    it('should save whoPays value to journey and redirect to pay-rate-type when prison is selected', async () => {
      req.body = {
        whoPays: 'prison',
      }

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.whoPays).toEqual('prison')
      expect(res.redirect).toHaveBeenCalledWith('pay-rate-type')
    })

    it('should handle external correctly with default values', async () => {
      req.body = {
        whoPays: 'external',
      }

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.whoPays).toEqual('external')
      expect(req.journeyData.createJourney.qualificationOption).toEqual('no')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('start-date')
    })
  })

  describe('VALIDATION', () => {
    it('type must not be empty', async () => {
      const body = {}

      const requestObject = plainToInstance(WhoPays, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'type',
            error: 'Select who pays prisoners for this activity',
          },
        ]),
      )
    })

    it('passes validation when type is provided', async () => {
      const body = {
        type: 'prison',
      }

      const requestObject = plainToInstance(WhoPays, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
