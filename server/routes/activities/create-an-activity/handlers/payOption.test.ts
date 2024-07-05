import { Request, Response } from 'express'

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import PayOption, { PayOptionForm } from './payOption'
import { YesNo } from '../../../../@types/activities'
import { ActivityPay, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Pay option', () => {
  const handler = new PayOption(activitiesService, prisonService)
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
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
      params: {},
      query: {},
      body: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly', async () => {
      handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-option')
    })
  })

  describe('POST', () => {
    it('should remove pay and redirect to qualifications page when unpaid is selected', async () => {
      req.body.paid = YesNo.NO

      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 1,
        },
      ] as ActivityPay[]

      req.session.createJourney.flat = [
        {
          prisonPayBand: { id: 2 },
          rate: 2,
        },
      ] as ActivityPay[]

      await handler.POST(req, res)

      expect(req.session.createJourney.pay).toHaveLength(0)
      expect(req.session.createJourney.flat).toHaveLength(0)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
    })

    it('should redirect to check pay page if activity is paid and has pay', async () => {
      req.body.paid = YesNo.YES
      req.session.createJourney.pay = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 1,
        },
      ] as ActivityPay[]

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should redirect to check pay page if activity is paid and has no pay', async () => {
      req.body.paid = YesNo.YES
      req.session.createJourney.pay = []
      req.session.createJourney.flat = []

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay-rate-type')
    })

    describe('Edit', () => {
      beforeEach(() => {
        req.params.mode = 'edit'
        req.session.createJourney.activityId = 2
        req.session.createJourney.name = 'Activity name'
      })

      it('should update activity to unpaid and show success message if no pay selected', async () => {
        req.body.paid = YesNo.NO

        await handler.POST(req, res)

        const activityUpdateRequest = {
          paid: false,
          pay: [],
        } as ActivityUpdateRequest

        expect(activitiesService.updateActivity).toHaveBeenCalledWith(2, activityUpdateRequest, res.locals.user)

        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          '/activities/view/2',
          'Activity updated',
          `You've updated pay for Activity name. People will now not be paid for attending.`,
        )
      })
    })
  })

  describe('Form validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(PayOptionForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'paid', error: 'Select yes if people will be paid for attending this activity' },
      ])
    })

    it('validation fails if value is invalid', async () => {
      const body = {
        paid: 'invalid',
      }

      const requestObject = plainToInstance(PayOptionForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'paid', error: 'Select yes if people will be paid for attending this activity' },
      ])
    })

    it('validation passes if valid value is provided', async () => {
      const body = {
        paid: YesNo.YES,
      }

      const requestObject = plainToInstance(PayOptionForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
