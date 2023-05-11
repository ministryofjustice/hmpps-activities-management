import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import HowToAddPrisoners, { HowToAddOptions, HowToAddPrisonersForm } from './howToAddPrisoners'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - How to add prisoners', () => {
  const handler = new HowToAddPrisoners(new EditAppointmentService(activitiesService))
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the how to add prisoners view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/how-to-add-prisoners', {
        backLinkHref: '/appointments',
        HowToAddOptions,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to select prisoner page', async () => {
      req.body = {
        howToAdd: 'SEARCH',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('select-prisoner')
    })

    it('should redirect to upload by CSV page', async () => {
      req.body = {
        howToAdd: 'CSV',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('upload-by-csv')
    })
  })

  describe('Validation', () => {
    it('should pass validation on a valid selection', async () => {
      const body = {
        howToAdd: 'SEARCH',
      }

      const requestObject = plainToInstance(HowToAddPrisonersForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation on invalid selection', async () => {
      const body = {
        howToAdd: 'INVALID',
      }

      const requestObject = plainToInstance(HowToAddPrisonersForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select how to add prisoners', property: 'howToAdd' }]))
    })
  })
})
