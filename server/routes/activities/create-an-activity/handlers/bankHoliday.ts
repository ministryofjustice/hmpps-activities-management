import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class BankHolidayOption {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want the schedule to run on a bank holiday.' })
  runsOnBankHoliday: boolean
}

export default class BankHolidayOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create-an-activity/bank-holiday-option')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.runsOnBankHoliday = req.body.runsOnBankHoliday === 'yes'
    if (req.query && req.query.fromEditActivity) {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        runsOnBankHoliday: req.session.createJourney.runsOnBankHoliday,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the bank holiday option for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    // If the location has already been set, skip the location page
    else if (req.session.createJourney.inCell) res.redirectOrReturn('capacity')
    else res.redirectOrReturn('location')
  }
}
