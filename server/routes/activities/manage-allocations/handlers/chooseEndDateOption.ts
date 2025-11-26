import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class ChooseEndDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Select if you want to change the date or remove it' })
  chooseEndDateOption: string
}

export default class ChooseEndDateOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/manage-allocations/choose-end-date-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { allocationId } = req.params
    const { scheduleId } = req.journeyData.allocateJourney.activity
    if (req.body.chooseEndDateOption === 'remove') {
      return res.redirectOrReturn(`remove-end-date-option`)
    }
    return res.redirect(
      `/activities/allocations/edit/${allocationId}/deallocate-today-option?allocationIds=${allocationId}&scheduleId=${scheduleId}`,
    )
  }
}
