import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import DescriptionRoutes, { Description } from './description'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Appointment - Description', () => {
  const handler = new DescriptionRoutes()

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/description')
    })
  })

  describe('POST', () => {
    it('redirect as expected when the description option is yes', async () => {
      req.body = {
        descriptionOption: 'yes',
      }
      await handler.POST(req, res)
      expect(req.session.appointmentJourney.descriptionOption).toEqual('yes')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })

  describe('POST', () => {
    it('redirect as expected when the description option is no', async () => {
      req.body = {
        descriptionOption: 'no',
        description: 'Appointment description',
      }
      await handler.POST(req, res)
      expect(req.session.appointmentJourney.descriptionOption).toEqual('no')
      expect(req.session.appointmentJourney.description).toEqual('Appointment description')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })

  it('validation fails when description is not entered and option is no', async () => {
    const body = {
      descriptionOption: 'no',
      description: '',
    }

    const requestObject = plainToInstance(Description, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual([{ property: 'description', error: 'Please enter an appointment description' }])
  })

  it('validation fails when description is greater than 40 characters', async () => {
    const body = {
      descriptionOption: 'no',
      description: '12345678901234567890123456789012345678901',
    }

    const requestObject = plainToInstance(Description, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual([
      { property: 'description', error: 'You must enter a description which has no more than 40 characters' },
    ])
  })
})
