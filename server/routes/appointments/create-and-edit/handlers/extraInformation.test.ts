import { Request, Response } from 'express'
import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ExtraInformationRoutes, { ExtraInformation } from './extraInformation'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { YesNo } from '../../../../@types/activities'
import ExtraInformationValidator from '../../../../validators/extraInformation'

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

      expect(req.session.editAppointmentJourney.extraInformation).toEqual('Updated appointment level extra information')
      expect(editAppointmentService.redirectOrEdit).toHaveBeenCalledWith(req, res, 'extra-information')
    })
  })
})
describe('Validation', () => {
  class ExtraInfoForm {
    @Expose()
    @ExtraInformationValidator({ message: 'Enter the court name and any extra information' })
    extraInformation: string
  }

  it('should pass validation when extraInformation is empty and category code is not VLB', async () => {
    const body = {
      extraInformation: '',
      appointmentJourney: {
        category: {
          code: 'ABC',
        },
      },
    }

    const requestObject = plainToInstance(ExtraInfoForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    // Expecting a specific validation error related to extraInformation
    expect(errors).toHaveLength(0)
  })

  it.each([
    { extraInformation: Array(4001).fill('a').join(''), isValid: false },
    { extraInformation: Array(4000).fill('a').join(''), isValid: true },
    { extraInformation: Array(3999).fill('a').join(''), isValid: true },
  ])('should validate extra information character length', async ({ extraInformation, isValid }) => {
    const body = {
      extraInformation,
      appointmentJourney: {
        category: {
          code: 'VLB',
        },
      },
    }

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
