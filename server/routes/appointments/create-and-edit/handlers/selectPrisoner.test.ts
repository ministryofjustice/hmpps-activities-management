import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './selectPrisoner'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { EditAppointmentJourney } from '../editAppointmentJourney'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Appointments - Select Prisoner', () => {
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
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
      body: {},
      query: { preserveHistory: 'true' },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the default select-prisoner view if no search term entered', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/select-prisoner', {
        preserveHistory: 'true',
      })
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/select-prisoner', {
        prisoners: prisonersResult,
        query: 'John',
      })
    })
  })

  describe('SELECT_PRISONER', () => {
    it('should save (and replace) prisoner in session then redirect if prisoner selected (individual)', async () => {
      req.body = {
        selectedPrisoner: 'A1234BC',
      }
      req.session.appointmentJourney = {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.INDIVIDUAL,
        prisoners: [
          {
            number: 'X9876YZ',
            name: 'James Johnson',
            cellLocation: '2-2-2',
          },
        ],
      }

      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.SELECT_PRISONER(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'John Smith',
          cellLocation: '1-1-1',
        },
      ])
      expect(res.redirectOrReturn).toHaveBeenCalledWith('category')
    })

    it('should add prisoner to edit session and redirect if prisoner selected (group)', async () => {
      req.body = {
        selectedPrisoner: 'A1234BC',
      }
      req.session.appointmentJourney = {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        prisoners: [
          {
            number: 'X9876YZ',
            name: 'James Johnson',
            cellLocation: '2-2-2',
          },
        ],
      }

      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.SELECT_PRISONER(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'X9876YZ',
          name: 'James Johnson',
          cellLocation: '2-2-2',
        },
        {
          number: 'A1234BC',
          name: 'John Smith',
          cellLocation: '1-1-1',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('should add prisoner to session and redirect if prisoner selected (edit)', async () => {
      req.body = {
        selectedPrisoner: 'A1234BC',
      }
      req.session.appointmentJourney = {
        mode: AppointmentJourneyMode.EDIT,
        type: AppointmentType.GROUP,
      }
      req.session.editAppointmentJourney = {
        addPrisoners: [
          {
            number: 'X9876YZ',
            name: 'James Johnson',
            cellLocation: '2-2-2',
          },
        ],
      } as EditAppointmentJourney

      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.SELECT_PRISONER(req, res)

      expect(req.session.editAppointmentJourney.addPrisoners).toEqual([
        {
          number: 'X9876YZ',
          name: 'James Johnson',
          cellLocation: '2-2-2',
        },
        {
          number: 'A1234BC',
          name: 'John Smith',
          cellLocation: '1-1-1',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('validation fails when prisoner selected is not a prisoner from list', async () => {
      req.body = {
        selectedPrisoner: 'X0000ZY',
      }

      when(prisonService.getInmateByPrisonerNumber).calledWith('X0000ZY', res.locals.user).mockRejectedValue(null)

      await handler.SELECT_PRISONER(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('selectedPrisoner', 'You must select one option')
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
        expect.arrayContaining([{ property: 'query', error: 'Enter a name or prison number to search by' }]),
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
