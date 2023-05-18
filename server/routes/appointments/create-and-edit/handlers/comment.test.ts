import { Request, Response } from 'express'
import CommentRoutes from './comment'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Comment', () => {
  const handler = new CommentRoutes(new EditAppointmentService(activitiesService))
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
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/comment', {
        backLinkHref: 'repeat',
        isCtaAcceptAndSave: false,
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
        appointmentId: '2',
        occurrenceId: '12',
      }
    })

    it('should update the comment and redirect back to the occurrence details page', async () => {
      req.body = {
        comment: 'Updated appointment level comment',
      }

      await handler.EDIT(req, res)

      expect(activitiesService.editAppointmentOccurrence)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/2/occurrence/12',
        "You've changed the heads up for this appointment",
      )
    })
  })
})
