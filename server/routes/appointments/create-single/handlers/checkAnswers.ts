import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { formatDate } from '../../../../utils/utils'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import { AppointmentCreateRequest } from '../../../../@types/activitiesAPI/types'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { createSingleAppointmentJourney } = req.session

    const startDate = formatDate(
      plainToInstance(SimpleDate, createSingleAppointmentJourney.startDate).toRichDate(),
      'do MMMM yyyy',
    )
    const startTime = '09:00'
    const endTime = '10:30'

    res.render(`pages/appointments/create-single/check-answers`, {
      startDate,
      startTime,
      endTime,
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
      startDate: createSingleAppointmentJourney.startDate,
      startTime: '09:00',
      endTime: '10:30',
      prisonerNumbers: [createSingleAppointmentJourney.prisoner.number],
    } as AppointmentCreateRequest

    const response = await this.activitiesService.createAppointment(appointment, user)
    res.redirect(`confirmation/${response.id}`)

    // res.redirect(`check-answers`)
  }
}
