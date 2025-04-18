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
      query: {},
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
        preserveHistory: undefined,
      })
    })

    it('should render the default select-prisoner view if no search term entered with preserve history', async () => {
      req.query = { preserveHistory: 'true' }

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

    it('should render with a prisoners list if search term is entered with preserve history', async () => {
      req.query = {
        query: 'not important for this test',
        preserveHistory: 'true',
      }

      when(prisonService.searchPrisonInmates).mockResolvedValue({ content: [] })

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/select-prisoner', {
        prisoners: [],
        preserveHistory: 'true',
        query: 'not important for this test',
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

    it('should redirect with query string with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      req.body = {
        query: 'john',
      }

      await handler.SEARCH(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`select-prisoner?query=john&preserveHistory=true`)
    })
  })

  describe('SELECT_PRISONER', () => {
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
            firstName: 'James',
            lastName: 'Johnson',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        ],
      }

      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
        prisonId: 'MDI',
        status: 'ACTIVE IN',
        category: 'B',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.SELECT_PRISONER(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'X9876YZ',
          name: 'James Johnson',
          firstName: 'James',
          lastName: 'Johnson',
          cellLocation: '2-2-2',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
          category: undefined,
        },
        {
          number: 'A1234BC',
          name: 'John Smith',
          firstName: 'John',
          lastName: 'Smith',
          cellLocation: '1-1-1',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
          category: 'B',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-prisoners')
    })

    it('should redirect to review prisoners with preserve history (group)', async () => {
      req.query = { preserveHistory: 'true' }
      req.body = {
        selectedPrisoner: 'X9876YZ',
      }
      req.session.appointmentJourney = {
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        prisoners: [
          {
            number: 'X9876YZ',
            name: 'James Johnson',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
            category: 'A',
          },
        ],
      }

      const prisonerInfo = {
        prisonerNumber: 'X9876YZ',
        firstName: 'James',
        lastName: 'Johnson',
        cellLocation: '2-2-2',
        category: 'A',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('X9876YZ', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.SELECT_PRISONER(req, res)

      expect(res.redirect).toHaveBeenCalledWith('review-prisoners?preserveHistory=true')
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
            firstName: 'James',
            lastName: 'Johnson',
            cellLocation: '2-2-2',
            category: 'F',
          },
        ],
      } as unknown as EditAppointmentJourney

      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
        category: 'G',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      await handler.SELECT_PRISONER(req, res)

      expect(req.session.editAppointmentJourney.addPrisoners).toEqual([
        {
          number: 'X9876YZ',
          name: 'James Johnson',
          firstName: 'James',
          lastName: 'Johnson',
          cellLocation: '2-2-2',
          category: 'F',
        },
        {
          number: 'A1234BC',
          name: 'John Smith',
          firstName: 'John',
          lastName: 'Smith',
          cellLocation: '1-1-1',
          category: 'G',
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

  describe('Validation', () => {
    describe('SelectPrisoner', () => {
      it('validation fails when prisoner is not selected', async () => {
        const body = {
          appointmentJourney: {
            mode: AppointmentJourneyMode.EDIT,
            prisoners: [],
          },
        }

        const requestObject = plainToInstance(SelectPrisoner, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([{ property: 'selectedPrisoner', error: 'You must select one option' }]),
        )
      })

      it('validation fails when selected prisoner is an empty string', async () => {
        const body = {
          selectedPrisoner: '',
          appointmentJourney: {
            mode: AppointmentJourneyMode.EDIT,
            prisoners: [],
          },
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
          appointmentJourney: {
            mode: AppointmentJourneyMode.EDIT,
            prisoners: [],
          },
        }

        const requestObject = plainToInstance(SelectPrisoner, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toHaveLength(0)
      })

      it('fails validation when selected prisoner is already attending', async () => {
        const body = {
          selectedPrisoner: 'A1234BC',
          appointmentJourney: {
            mode: AppointmentJourneyMode.EDIT,
            prisoners: [{ number: 'A1234BC' }],
          },
        }

        const requestObject = plainToInstance(SelectPrisoner, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([
            {
              property: 'selectedPrisoner',
              error: 'The prisoner you have selected is already attending this appointment',
            },
          ]),
        )
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
