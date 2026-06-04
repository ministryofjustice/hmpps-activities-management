import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './selectPrisoner'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Exclusions - Select Prisoner', () => {
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
    } as unknown as Response

    req = {
      body: {},
      query: {},
      session: {},
      get: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the default select-prisoner view if no search term entered', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/exclusions/select-prisoner', expect.any(Object))
    })

    it('should render with a prisoners list if search term is entered', async () => {
      req.query = {
        query: 'John',
      }

      const prisonersResult = [
        { prisonerNumber: 'A1234BC', firstName: 'John', lastName: 'Smith', cellLocation: '1-1-1' },
        { prisonerNumber: 'X9876YZ', firstName: 'James', lastName: 'Johnson', cellLocation: '2-2-2' },
      ] as Prisoner[]

      when(prisonService.searchPrisonInmates)
        .calledWith('John', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/exclusions/select-prisoner', {
        backLinkHref: '/activities/allocations',
        prisoners: prisonersResult,
        query: 'John',
      })
    })

    describe('Back link', () => {
      const setReferrer = (referrer?: string) => {
        ;(req.get as jest.Mock).mockReturnValue(referrer)
      }

      const expectBackLink = async (expected: string) => {
        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'pages/activities/exclusions/select-prisoner',
          expect.objectContaining({ backLinkHref: expected }),
        )
      }

      it('should default to allocations and clear the session when referrer is undefined', async () => {
        req.session.prisonerSearchBackLinkHref = '/activities/exclusions/prisoner/A1234CD'
        setReferrer(undefined)

        await expectBackLink('/activities/allocations')

        expect(req.session.prisonerSearchBackLinkHref).toBeNull()
      })

      it('should default to allocations and clear the session when referrer is allocations page', async () => {
        req.session.prisonerSearchBackLinkHref = '/activities/exclusions/prisoner/A1234CD'
        setReferrer('http://localhost:3000/activities/allocations')

        await expectBackLink('/activities/allocations')

        expect(req.session.prisonerSearchBackLinkHref).toBeNull()
      })

      it('should default to allocations on the search results page', async () => {
        req.query = { query: 'John' }
        req.session.prisonerSearchBackLinkHref = '/activities/exclusions/prisoner/A1234CD'
        setReferrer('http://localhost:3000/activities/exclusions/prisoner/A1234CD')

        when(prisonService.searchPrisonInmates).calledWith('John', res.locals.user).mockResolvedValue({ content: [] })

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'pages/activities/exclusions/select-prisoner',
          expect.objectContaining({ backLinkHref: '/activities/allocations' }),
        )
      })

      it('should use the prisoner exclusions page back link when referrer regex matches and session value exists', async () => {
        req.session.prisonerSearchBackLinkHref = '/activities/exclusions/prisoner/A1234CD'
        setReferrer('http://localhost:3000/activities/exclusions/prisoner/A1234CD')

        await expectBackLink('/activities/exclusions/prisoner/A1234CD')
      })

      it('should fall back to allocations when referrer matches but prisonerSearchBackLinkHref is undefined', async () => {
        req.session.prisonerSearchBackLinkHref = undefined
        setReferrer('http://localhost:3000/activities/exclusions/prisoner/A1234CD')

        await expectBackLink('/activities/allocations')
      })
    })
  })

  describe('SEARCH', () => {
    it('should redirect with query string', async () => {
      req.body = {
        query: 'john',
      }

      await handler.SEARCH(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`select-prisoner?query=john`)
    })
  })

  describe('SELECT_PRISONER', () => {
    it('should redirect to view the prisoners allocations', async () => {
      req.body = {
        selectedPrisoner: 'A1234BC',
      }

      await handler.SELECT_PRISONER(req, res)

      expect(res.redirect).toHaveBeenCalledWith('prisoner/A1234BC')
    })
  })

  describe('Validation', () => {
    describe('SelectPrisoner', () => {
      it('validation fails when prisoner is not selected', async () => {
        const body = {}

        const requestObject = plainToInstance(SelectPrisoner, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([{ property: 'selectedPrisoner', error: 'You must select one option' }]),
        )
      })

      it('validation fails when selected prisoner is an empty string', async () => {
        const body = {
          selectedPrisoner: '',
        }

        const requestObject = plainToInstance(SelectPrisoner, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([{ property: 'selectedPrisoner', error: 'You must select one option' }]),
        )
      })

      it('passes validation when selected prisoner is not empty', async () => {
        const body = {
          selectedPrisoner: 'A1234BC',
        }

        const requestObject = plainToInstance(SelectPrisoner, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toHaveLength(0)
      })
    })
  })

  describe('PrisonerSearch', () => {
    it('validation fails when query is empty', async () => {
      const body = {
        query: '',
      }

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { property: 'query', error: 'You must enter a name or prison number in the format A1234CD' },
        ]),
      )
    })

    it('passes validation when query search entered', async () => {
      const body = {
        query: 'john',
      }

      const requestObject = plainToInstance(PrisonerSearch, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
