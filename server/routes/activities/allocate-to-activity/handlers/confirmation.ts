import { Request, Response } from 'express'

export default class ConfirmationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney

    res.render('pages/activities/allocate-to-activity/confirmation', {
      activityId: activity.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: activity.name,
    })

    req.session.allocateJourney = null
  }
}
