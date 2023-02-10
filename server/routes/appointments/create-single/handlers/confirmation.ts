import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { formatDate } from '../../../../utils/utils'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { createSingleAppointmentJourney } = req.session

    const startDate = formatDate(
      plainToInstance(SimpleDate, createSingleAppointmentJourney.startDate).toRichDate(),
      'do MMMM yyyy',
    )
    const startTime = '9am'
    const endTime = '10:30am'

    res.render('pages/appointments/create-single/confirmation', {
      id: req.params.id as unknown as number,
      startDate,
      startTime,
      endTime,
    })
  }
}
