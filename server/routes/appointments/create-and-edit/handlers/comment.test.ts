import { Request, Response } from 'express'
import CommentRoutes from './comment'
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
    it('should render the comment view with back to repeat and continue', async () => {
      req.session.appointmentJourney.repeat = YesNo.NO

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/comment', {
        backLinkHref: 'repeat',
        isCtaAcceptAndSave: false,
      })
    })

    it('should render the comment view with back to repeat period and count and continue', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/comment', {
        backLinkHref: 'repeat-period-and-count',
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

      expect(req.session.appointmentJourney.comment).toEqual('Appointment level comment')
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

      expect(req.session.editAppointmentJourney.comment).toEqual('Updated appointment level comment')
      expect(editAppointmentService.redirectOrEdit).toHaveBeenCalledWith(req, res, 'comment')
    })
  })
})
