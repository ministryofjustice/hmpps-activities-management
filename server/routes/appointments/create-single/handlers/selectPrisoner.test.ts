import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import SelectPrisonerRoutes, { PrisonerSearch } from './selectPrisoner'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Single Appointment - Select Prisoner', () => {
  const handler = new SelectPrisonerRoutes(prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createSingleAppointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the select-prisoner view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/select-prisoner')
    })
  })

  describe('POST', () => {
    it('should save found prisoner in session and redirect to category page', async () => {
      req.body = {
        number: 'A1234BC',
      }

      when(prisonService.searchInmates)
        .calledWith({ prisonIds: ['TPR'], prisonerIdentifier: 'A1234BC', includeAliases: false }, res.locals.user)
        .mockResolvedValue([
          { prisonerNumber: 'A1234BC', firstName: 'Test', lastName: 'Prisoner', cellLocation: '1-1-1' } as Prisoner,
        ])

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.prisoner).toEqual({
        number: 'A1234BC',
        displayName: 'Test Prisoner',
        cellLocation: '1-1-1',
        description: 'Test Prisoner | A1234BC | 1-1-1',
        summary: 'Test Prisoner<br/>A1234BC<br/>1-1-1',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('category')
    })

    it('validation fails when prisoner is not found', async () => {
      req.body = {
        number: 'A1234BC',
      }

      when(prisonService.searchInmates)
        .calledWith({ prisonIds: ['TPR'], prisonerIdentifier: 'A1234BC', includeAliases: false }, res.locals.user)
        .mockResolvedValue([])

      await handler.POST(req, res)

      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify([{ field: 'number', message: `Prisoner with number A1234BC was not found` }]),
      )
      expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify({ number: 'A1234BC' }))
      expect(res.redirect).toHaveBeenCalledWith('back')
    })
  })

  describe('Validation', () => {
    it('validation fails when no number property is passed', async () => {
      const body = {}

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'number', error: 'Enter a prisoner number to search by' }]),
      )
    })

    it('validation fails when number is an empty string', async () => {
      const body = {
        number: '',
      }

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'number', error: 'Enter a prisoner number to search by' }]),
      )
    })

    it('passes validation when valid number is entered', async () => {
      const body = {
        number: 'A1234BC',
      }

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
