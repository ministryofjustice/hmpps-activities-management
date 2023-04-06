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
    const { createAppointmentJourney } = req.session

    res.render(`pages/appointments/create/check-answers`, {
      startDate: new Date(createAppointmentJourney.startDate.date),
      startTime: new Date(createAppointmentJourney.startTime.date),
      endTime: new Date(createAppointmentJourney.endTime.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createAppointmentJourney } = req.session

    const request = {
      categoryCode: createAppointmentJourney.category.code,
      prisonCode: user.activeCaseLoadId,
      internalLocationId: createAppointmentJourney.location.id,
      inCell: false,
      startDate: plainToInstance(SimpleDate, createAppointmentJourney.startDate).toIsoString(),
      startTime: plainToInstance(SimpleTime, createAppointmentJourney.startTime).toIsoString(),
      endTime: plainToInstance(SimpleTime, createAppointmentJourney.endTime).toIsoString(),
      prisonerNumbers: createAppointmentJourney.prisoners.map(p => p.number),
      appointmentType: createAppointmentJourney.type,
    } as AppointmentCreateRequest

    if (createAppointmentJourney.repeat === YesNo.YES) {
      request.repeat = {
        period: createAppointmentJourney.repeatPeriod,
        count: createAppointmentJourney.repeatCount,
      }
    }

    const response = await this.activitiesService.createAppointment(request, user)

    res.redirect(`confirmation/${response.id}`)
  }
}
