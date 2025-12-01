import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ExtraInformationRoutes, { ExtraInformation, StaffPrisonerExtraInformation } from './extraInformation'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { YesNo } from '../../../../@types/activities'

jest.mock('../../../../services/editAppointmentService')

const editAppointmentService = new EditAppointmentService(null, null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Create Appointment - Extra Information', () => {
  const handler = new ExtraInformationRoutes(editAppointmentService)
  let req: Request
  let res: Response
  const appointmentId = '2'

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
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
      journeyData: {
        editAppointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the extra information view', async () => {
      req.session.appointmentJourney.repeat = YesNo.NO

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/extra-information', {
        isCtaAcceptAndSave: false,
        prisoners: req.session.appointmentJourney.prisoners,
      })
    })
  })

  describe('CREATE', () => {
    it('should save extra information in session and redirect to check answers page', async () => {
      req.body = {
        extraInformation: 'Appointment level extra information',
      }

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.extraInformation).toEqual('Appointment level extra information')
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('EDIT', () => {
    beforeEach(() => {
      req.params = {
        appointmentId,
      }
    })

    it('should update the extra information and call redirect or edit', async () => {
      req.body = {
        extraInformation: 'Updated appointment level extra information',
      }

      await handler.EDIT(req, res)

      expect(req.journeyData.editAppointmentJourney.extraInformation).toEqual(
        'Updated appointment level extra information',
      )
      expect(editAppointmentService.redirectOrEdit).toHaveBeenCalledWith(req, res, 'extra-information')
    })
  })
})

describe('Validation - extra information', () => {
  it.each([
    { extraInformation: '', isValid: true },
    { extraInformation: Array(4001).fill('a').join(''), isValid: false },
    { extraInformation: Array(4000).fill('b').join(''), isValid: true },
    { extraInformation: Array(3999).fill('c').join(''), isValid: true },
  ])('should validate extra information character length', async ({ extraInformation, isValid }) => {
    const body = { extraInformation }

    const requestObject = plainToInstance(ExtraInformation, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
    if (isValid) {
      expect(errors).toHaveLength(0)
    } else {
      expect(errors).toEqual([
        {
          property: 'extraInformation',
          error: 'You must enter extra information which has no more than 4,000 characters',
        },
      ])
    }
  })
})

describe('Validation - staff and prisoner extra information', () => {
  it.each([
    { extraInformation: '', isValid: true },
    { extraInformation: Array(4001).fill('a').join(''), isValid: false },
    { extraInformation: Array(4000).fill('b').join(''), isValid: true },
    { extraInformation: Array(3999).fill('c').join(''), isValid: true },
  ])('should validate staff extra information character length', async ({ extraInformation, isValid }) => {
    const body = { extraInformation, prisonerExtraInformation: '' }

    const requestObject = plainToInstance(StaffPrisonerExtraInformation, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
    if (isValid) {
      expect(errors).toHaveLength(0)
    } else {
      expect(errors).toEqual([
        {
          property: 'extraInformation',
          error: 'You must enter notes for staff which has no more than 4,000 characters',
        },
      ])
    }
  })

  it.each([
    { prisonerExtraInformation: '', isValid: true },
    { prisonerExtraInformation: Array(801).fill('a').join(''), isValid: false },
    { prisonerExtraInformation: Array(800).fill('b').join(''), isValid: true },
    { prisonerExtraInformation: Array(799).fill('c').join(''), isValid: true },
  ])('should validate prisoner extra information character length', async ({ prisonerExtraInformation, isValid }) => {
    const body = { extraInformation: '', prisonerExtraInformation }

    const requestObject = plainToInstance(StaffPrisonerExtraInformation, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
    if (isValid) {
      expect(errors).toHaveLength(0)
    } else {
      expect(errors).toEqual([
        {
          property: 'prisonerExtraInformation',
          error: 'You must enter notes for prisoner which has no more than 800 characters',
        },
      ])
    }
  })
})
