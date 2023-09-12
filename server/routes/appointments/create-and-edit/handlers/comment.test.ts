import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CommentRoutes, { Comment } from './comment'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { YesNo } from '../../../../@types/activities'
import { AppointmentJourneyMode } from '../appointmentJourney'

jest.mock('../../../../services/editAppointmentService')

const editAppointmentService = new EditAppointmentService(null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Create Appointment - Comment', () => {
  const handler = new CommentRoutes(editAppointmentService)
  let req: Request
  let res: Response
  const appointmentId = '1'
  const occurrenceId = '2'

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
    it('should render the comment view with back to schedule and continue', async () => {
      req.session.appointmentJourney.repeat = YesNo.NO

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/comment', {
        backLinkHref: 'schedule',
        isCtaAcceptAndSave: false,
      })
    })

    it('should render the comment view with back to occurrence details and accept and save', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.params = {
        appointmentId,
        occurrenceId,
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/comment', {
        backLinkHref: `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
        isCtaAcceptAndSave: true,
      })
    })
  })

  describe('CREATE', () => {
    it('should save comment in session and redirect to check answers page', async () => {
      req.body = {
        comment: 'Appointment level comment',
      }

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.extraInformation).toEqual('Appointment level comment')
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('EDIT', () => {
    beforeEach(() => {
      req.params = {
        appointmentId,
        occurrenceId,
      }
    })

    it('should update the comment and call redirect or edit', async () => {
      req.body = {
        comment: 'Updated appointment level comment',
      }

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.extraInformation).toEqual('Updated appointment level comment')
      expect(editAppointmentService.redirectOrEdit).toHaveBeenCalledWith(req, res, 'comment')
    })
  })

  describe('Validation', () => {
    it.each([
      { comment: Array(4001).fill('a').join(''), isValid: false },
      { comment: Array(4000).fill('a').join(''), isValid: true },
      { comment: Array(3999).fill('a').join(''), isValid: true },
    ])('should validate comment character length', async ({ comment, isValid }) => {
      const body = {
        comment,
      }

      const requestObject = plainToInstance(Comment, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      if (isValid) {
        expect(errors).toHaveLength(0)
      } else {
        expect(errors).toEqual([
          { property: 'comment', error: 'You must enter a comment which has no more than 4,000 characters' },
        ])
      }
    })
  })
})
