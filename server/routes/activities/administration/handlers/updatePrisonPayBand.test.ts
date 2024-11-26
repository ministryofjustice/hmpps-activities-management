import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import UpdatePrisonPayBandRoutes, { UpdatePrisonPayBand } from './updatePrisonPayBand'
import { PrisonPayBand, PrisonPayBandUpdateRequest } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Update a prison pay band', () => {
  const handler = new UpdatePrisonPayBandRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'RSI',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
      addValidationError: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
    } as unknown as Request

    activitiesService.getAppointmentCategories.mockReturnValue(
      Promise.resolve([
        {
          code: 'ACTI',
          description: 'Activities',
        },
        {
          code: 'OIC',
          description: 'Adjudication Review',
        },
        {
          code: 'CANT',
          description: 'Canteen',
        },
      ]),
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render adding a pay band page', async () => {
      req.params.prisonPayBandId = '2'

      const prisonPayBands: PrisonPayBand[] = [
        { id: 1, alias: 'Low', displaySequence: 1, nomisPayBand: 1, description: 'desc 1', prisonCode: 'RSI' },
        { id: 2, alias: 'High', displaySequence: 2, nomisPayBand: 2, description: 'desc 2', prisonCode: 'RSI' },
        { id: 3, alias: 'High 2', displaySequence: 3, nomisPayBand: 3, description: 'desc 3', prisonCode: 'RSI' },
      ]

      when(activitiesService.getPayBandsForPrison).mockResolvedValue(prisonPayBands)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/administration/update-prison-pay-band', {
        prisonPayBand: {
          id: 2,
          alias: 'High',
          displaySequence: 2,
          nomisPayBand: 2,
          description: 'desc 2',
          prisonCode: 'RSI',
        },
      })
    })
  })

  describe('POST', () => {
    it('should create a pay band successfully', async () => {
      req.params.prisonPayBandId = '1'

      req.body = {
        description: 'desc',
        nomisPayBand: '1',
        displaySequence: '1',
        alias: 'alias',
      }

      const prisonPayBand: PrisonPayBand = {
        alias: 'alias',
        description: 'desc',
        displaySequence: 1,
        id: 1,
        nomisPayBand: 1,
        prisonCode: 'RSI',
        updatedBy: res.locals.user.username,
        updatedTime: '2023-02-17T10:22:04',
      }

      const request: PrisonPayBandUpdateRequest = {
        description: 'desc',
        nomisPayBand: 1,
        displaySequence: 1,
        alias: 'alias',
      }

      when(activitiesService.patchPrisonPayBand)
        .calledWith('RSI', request, 1, res.locals.user)
        .mockResolvedValueOnce(prisonPayBand)

      await handler.POST(req, res)

      expect(activitiesService.patchPrisonPayBand).toHaveBeenCalledWith(
        'RSI',
        {
          description: 'desc',
          nomisPayBand: 1,
          displaySequence: 1,
          alias: 'alias',
        },
        1,
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/admin/prison-pay-bands`,
        'Updated',
        "Prison pay band 'desc' updated",
      )
    })
  })

  describe('Validation', () => {
    it('validation fails if the description is not supplied', async () => {
      const body = {
        description: undefined,
        nomisPayBand: '1',
        displaySequence: '1',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Add a description',
            property: 'description',
          },
        ]),
      )
    })

    it('validation fails if the alias is not supplied', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: '1',
        displaySequence: '1',
        alias: undefined,
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Add an alias',
            property: 'alias',
          },
        ]),
      )
    })

    it('validation fails if the display sequence is not supplied', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: '1',
        displaySequence: undefined,
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Display sequence must be a positive number',
            property: 'displaySequence',
          },
        ]),
      )
    })

    it('validation fails if the nomis pay band is not supplied', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: undefined,
        displaySequence: '1',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Nomis pay band must be a positive number',
            property: 'nomisPayBand',
          },
        ]),
      )
    })

    it('validation fails if the display sequence is not numeric', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: '1',
        displaySequence: 'x',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Display sequence must be a number',
            property: 'displaySequence',
          },
        ]),
      )
    })

    it('validation fails if the display sequence is not a positive number', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: '1',
        displaySequence: '0',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Display sequence must be a positive number',
            property: 'displaySequence',
          },
        ]),
      )
    })

    it('validation fails if the nomis pay band is not numeric', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: 'x',
        displaySequence: '1',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Nomis pay band must be a positive number',
            property: 'nomisPayBand',
          },
        ]),
      )
    })

    it('validation fails if the nomis pay band is not a positive number', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: '-1',
        displaySequence: '1',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Nomis pay band must be a positive number',
            property: 'nomisPayBand',
          },
        ]),
      )
    })

    it('passes validation if description, alias, display sequece, nomis pay band are all supplied', async () => {
      const body = {
        description: 'desc',
        nomisPayBand: '1',
        displaySequence: '1',
        alias: 'alias',
      }

      const requestObject = plainToInstance(UpdatePrisonPayBand, { ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
