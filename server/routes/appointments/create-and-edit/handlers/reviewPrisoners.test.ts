import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Request, Response } from 'express'
import ReviewPrisoners, { AddAnotherForm } from './reviewPrisoners'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Appointment - Review Prisoners', () => {
  const handler = new ReviewPrisoners()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {},
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
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners')
    })
  })

  describe('POST', () => {
    it('should redirect to back to "how to add" page when "add another" is selected', async () => {
      req.body = {
        addAnother: 'YES',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('how-to-add-prisoners')
    })

    it('should redirect to back to "how to add" page when "add another" is not selected', async () => {
      req.body = {
        addAnother: 'NO',
      }
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('category')
    })
  })
})

describe('Validation', () => {
  it('should pass validation on a valid selection', async () => {
    const body = {
      addAnother: 'YES',
    }

    const requestObject = plainToInstance(AddAnotherForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([])
  })

  it('should fail validation on invalid selection', async () => {
    const body = {
      addAnother: 'INVALID',
    }

    const requestObject = plainToInstance(AddAnotherForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Select whether you want to add another prisoner', property: 'addAnother' }]),
    )
  })
})
