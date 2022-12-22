import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../utils/utils'
import MinimumIncentiveRoutes, { MinIncentiveLevel } from './minimumIncentive'
import PrisonService from '../../../services/prisonService'
import { IepLevel } from '../../../@types/incentivesApi/types'

jest.mock('../../../services/prisonService')

const prisonService = new PrisonService(null, null, null, null)

describe('Route Handlers - Create an activity - Minimum incentive', () => {
  const handler = new MinimumIncentiveRoutes(prisonService)
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
      when(prisonService.getIncentiveLevels).mockResolvedValue([
        { iepDescription: 'Basic', active: true },
        { iepDescription: 'Enhanced', active: true },
        { iepDescription: 'Enhanced 2', active: false },
      ] as IepLevel[])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/minimum-incentive', {
        incentiveLevels: [
          { iepDescription: 'Basic', active: true },
          { iepDescription: 'Enhanced', active: true },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should save selected minimum incentive level and applicable incentive levels in session and redirect to check answers page', async () => {
      req.body = {
        minimumIncentive: 'Standard',
      }

      when(prisonService.getIncentiveLevels).mockResolvedValue([
        { iepDescription: 'Basic', sequence: 0, active: true },
        { iepDescription: 'Standard', sequence: 1, active: true },
        { iepDescription: 'Enhanced', sequence: 2, active: true },
        { iepDescription: 'Enhanced 2', sequence: 3, active: false },
      ] as IepLevel[])

      await handler.POST(req, res)

      expect(req.session.createJourney.minimumIncentive).toEqual('Standard')
      expect(req.session.createJourney.incentiveLevels).toEqual(['Standard', 'Enhanced'])
      expect(res.redirectOrReturn).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(MinIncentiveLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'minimumIncentive', error: 'Select a minimum incentive level' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        minimumIncentive: '',
      }

      const requestObject = plainToInstance(MinIncentiveLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'minimumIncentive', error: 'Select a minimum incentive level' }])
    })

    it('passes validation', async () => {
      const body = {
        minimumIncentive: 'Standard',
      }

      const requestObject = plainToInstance(MinIncentiveLevel, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
