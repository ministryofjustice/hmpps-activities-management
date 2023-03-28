import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import SelectPrisonerRoutes, { PrisonerSearch } from './selectPrisoner'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { FormValidationError } from '../../../../formValidationErrorHandler'
import { AppointmentType } from '../journey'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Appointment - Select Prisoner', () => {
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
        createAppointmentJourney: {},
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create/select-prisoner')
    })
  })

  describe('POST', () => {
    it('should save found prisoner in session and redirect to category page', async () => {
      req.body = {
        query: 'A1234BC',
      }
      req.session.createAppointmentJourney = {
        type: AppointmentType.INDIVIDUAL,
      }

      prisonService.searchPrisonInmates.mockResolvedValue({
        content: [
          { prisonerNumber: 'A1234BC', firstName: 'Test', lastName: 'Prisoner', cellLocation: '1-1-1' } as Prisoner,
        ],
        empty: false,
      })

      await handler.POST(req, res)

      expect(req.session.createAppointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'Test Prisoner',
          cellLocation: '1-1-1',
        },
      ])
      expect(res.redirectOrReturn).toHaveBeenCalledWith('category')
    })

    it('validation fails when prisoner is not found', async () => {
      req.body = {
        query: 'A1234BC',
      }

      when(prisonService.searchPrisonInmates)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue({ content: [], empty: true })

      let error = null
      try {
        await handler.POST(req, res)
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(FormValidationError)
      expect(error.field).toEqual('query')
      expect(error.message).toEqual('No prisoners found for query "A1234BC"')
    })
  })

  describe('Validation', () => {
    it('validation fails when no number property is passed', async () => {
      const body = {}

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'query', error: 'Enter a name or prisoner number to search by' }]),
      )
    })

    it('validation fails when number is an empty string', async () => {
      const body = {
        query: '',
      }

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'query', error: 'Enter a name or prisoner number to search by' }]),
      )
    })

    it('passes validation when valid number is entered', async () => {
      const body = {
        query: 'A1234BC',
      }

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
