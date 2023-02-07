import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create-single/check-answers`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // const { user } = res.locals
    // const { createSingleAppointmentJourney } = req.session

    // TODO: Populate create object and post to API
    // const appointment = {
    //   bookingId:
    //   prisonerNumber:
    //   prisonCode: user.activeCaseLoadId,
    //   internalLocationId: ,
    //   categoryId:
    //   startDate:
    //   startTime:
    //   endTime:
    // } as AppointmentCreateRequest

    // const response = await this.activitiesService.createAppointment(appointment, user)
    // res.redirect(`confirmation/${response.id}`)
    res.redirect(`check-answers`)
  }
}
