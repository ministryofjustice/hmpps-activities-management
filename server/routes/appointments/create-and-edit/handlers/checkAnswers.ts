import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { AppointmentCreateRequest } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/check-answers', {
      startDate: new Date(appointmentJourney.startDate.date),
      startTime: new Date(appointmentJourney.startTime.date),
      endTime: new Date(appointmentJourney.endTime.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session

    const request = {
      categoryCode: appointmentJourney.category.code,
      prisonCode: user.activeCaseLoadId,
      internalLocationId: appointmentJourney.location.id,
      inCell: false,
      startDate: plainToInstance(SimpleDate, appointmentJourney.startDate).toIsoString(),
      startTime: plainToInstance(SimpleTime, appointmentJourney.startTime).toIsoString(),
      endTime: plainToInstance(SimpleTime, appointmentJourney.endTime).toIsoString(),
      prisonerNumbers: appointmentJourney.prisoners.map(p => p.number),
      appointmentType: appointmentJourney.type,
    } as AppointmentCreateRequest

    if (appointmentJourney.repeat === YesNo.YES) {
      request.repeat = {
        period: appointmentJourney.repeatPeriod,
        count: appointmentJourney.repeatCount,
      }
    }

    const response = await this.activitiesService.createAppointment(request, user)

    res.redirect(`confirmation/${response.id}`)
  }
}
