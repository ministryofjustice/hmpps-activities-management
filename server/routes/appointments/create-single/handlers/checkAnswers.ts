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
    const { createSingleAppointmentJourney } = req.session

    res.render(`pages/appointments/create-single/check-answers`, {
      startDate: new Date(createSingleAppointmentJourney.startDate.date),
      startTime: new Date(createSingleAppointmentJourney.startTime.date),
      endTime: new Date(createSingleAppointmentJourney.endTime.date),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { createSingleAppointmentJourney } = req.session

    const appointment = {
      categoryId: createSingleAppointmentJourney.category.id,
      prisonCode: user.activeCaseLoadId,
      internalLocationId: createSingleAppointmentJourney.location.id,
      inCell: false,
      startDate: plainToInstance(SimpleDate, createSingleAppointmentJourney.startDate).toIsoString(),
      startTime: plainToInstance(SimpleTime, createSingleAppointmentJourney.startTime).toIsoString(),
      endTime: plainToInstance(SimpleTime, createSingleAppointmentJourney.endTime).toIsoString(),
      prisonerNumbers: [createSingleAppointmentJourney.prisoner.number],
    } as AppointmentCreateRequest

    if (createSingleAppointmentJourney.repeat === YesNo.YES) {
      appointment.repeat = {
        period: createSingleAppointmentJourney.repeatPeriod,
        count: createSingleAppointmentJourney.repeatCount,
      }
    }

    const response = await this.activitiesService.createAppointment(appointment, user)

    res.redirect(`confirmation/${response.id}`)
  }
}
