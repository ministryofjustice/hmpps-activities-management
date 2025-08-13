import { Request, Response } from 'express'

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PayOption, { PayOptionForm } from './payOption'
import { YesNo } from '../../../../@types/activities'
import { ActivityPay, ActivityPayHistory, ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Pay option', () => {
  const handler = new PayOption(activitiesService)
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
      routeContext: { mode: 'create ' },
      journeyData: {
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

      req.journeyData.createJourney.pay = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 100,
        },
      ] as ActivityPay[]

      req.journeyData.createJourney.payChange = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 100,
          changedDetails: 'New pay rate added: £1.00',
          changedBy: 'joebloggs',
        },
      ] as ActivityPayHistory[]

      req.journeyData.createJourney.flat = [
        {
          prisonPayBand: { id: 2 },
          rate: 2,
        },
      ] as ActivityPay[]

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.pay).toHaveLength(0)
      expect(req.journeyData.createJourney.payChange).toHaveLength(0)
      expect(req.journeyData.createJourney.flat).toHaveLength(0)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('qualification')
    })

    it('should redirect to check pay page if activity is paid and has pay', async () => {
      req.body.paid = YesNo.YES
      req.journeyData.createJourney.pay = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 100,
        },
      ] as ActivityPay[]

      req.journeyData.createJourney.payChange = [
        {
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: { id: 1 },
          rate: 100,
          changedDetails: 'New pay rate added: £1.00',
          changedBy: 'joebloggs',
        },
      ] as ActivityPayHistory[]

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.pay).toHaveLength(1)
      expect(req.journeyData.createJourney.payChange).toHaveLength(1)
      expect(res.redirect).toHaveBeenCalledWith('check-pay')
    })

    it('should redirect to check pay page if activity is paid and has no pay', async () => {
      req.body.paid = YesNo.YES
      req.journeyData.createJourney.pay = []
      req.journeyData.createJourney.payChange = []
      req.journeyData.createJourney.flat = []

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('pay-rate-type')
    })

    describe('Edit', () => {
      beforeEach(() => {
        req = {
          routeContext: { mode: 'edit' },
          session: {},
          journeyData: {
            createJourney: {
              activityId: 2,
              name: 'Activity name',
            },
          },
          body: {},
          query: {},
        } as unknown as Request
      })

      it('should update activity to unpaid and show success message if no pay selected', async () => {
        req.body.paid = YesNo.NO

        await handler.POST(req, res)

        const activityUpdateRequest = {
          paid: false,
          pay: [],
          payChange: [],
        } as ActivityUpdateRequest

        expect(req.journeyData.createJourney.pay).toHaveLength(0)
        expect(req.journeyData.createJourney.payChange).toHaveLength(0)
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
