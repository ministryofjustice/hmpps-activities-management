import { Request, Response } from 'express'

import PrisonService from '../../../../services/prisonService'
import CheckPayRoutes from './checkPay'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../utils/helpers/incentiveLevelPayMappingUtil', () => {
  return function factory() {
    return {
      getPayGroupedByIncentiveLevel: () => [
        {
          incentiveLevel: 'Standard',
          pays: [{ incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Common', rate: '150' }],
        },
      ],
    }
  }
})

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Check pay', () => {
  const handler = new CheckPayRoutes(prisonService)
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
      redirectOrReturn: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      flash: jest.fn(),
      query: {},
      params: {},
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          riskLevel: 'High',
          pay: [{ incentiveNomisCode: 'STD', incentiveLevel: 'Standard', bandId: 1, rate: 100 }],
          flat: [],
          incentiveLevels: ['Standard', 'Enhanced'],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/check-pay', {
        flatPay: [],
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [{ bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150' }],
          },
        ],
      })
    })

    it('should render EDIT page correctly', async () => {
      req.params.mode = 'edit'
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/edit-pay', {
        flatPay: [],
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [{ bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150' }],
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should add a validation message to flash if no pay bands are added', async () => {
      req.session.createJourney.pay = []
      req.session.createJourney.flat = []

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('', 'Add at least one pay rate')
    })

    it('should redirect to qualification page', async () => {
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
    })
  })
})
