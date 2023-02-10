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
    const { prisoner } = createSingleAppointmentJourney

    const startDate = plainToInstance(SimpleDate, createSingleAppointmentJourney.startDate).toRichDate()
    // const formattedStartDate = formatDate(startDate, "EEEE 'the' do 'of' MMMM yyyy")
    const startTime = new Date(startDate)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(startDate)
    endTime.setHours(10, 30, 0, 0)

    res.render(`pages/appointments/create-single/check-answers`, {
      prisonerDescription: `${prisoner.displayName}, ${prisoner.number}, ${prisoner.cellLocation}`,
      // startDate: formatDate(startDate, "EEEE 'the' do 'of' MMMM yyyy"),
      startDate: formatDate(startDate, 'EEEE d MMMM yyyy'),
      startTime: formatDate(startTime, 'HH:mm'),
      endTime: formatDate(endTime, 'HH:mm'),
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
      startDate: formatDate(
        plainToInstance(SimpleDate, createSingleAppointmentJourney.startDate).toRichDate(),
        'yyyy-MM-dd',
      ),
      startTime: '09:00',
      endTime: '10:30',
      prisonerNumbers: [createSingleAppointmentJourney.prisoner.number],
    } as AppointmentCreateRequest

    const response = await this.activitiesService.createAppointment(appointment, user)

    res.redirect(`confirmation/${response.id}`)
  }
}
