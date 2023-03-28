import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Request, Response } from 'express'
import HowToAddPrisoners, { HowToAddOptions, HowToAddPrisonersForm } from './howToAddPrisoners'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Appointment - How to add prisoners', () => {
  const handler = new HowToAddPrisoners()
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
        createAppointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the how to add prisoners view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create/how-to-add-prisoners', { HowToAddOptions })
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
