import { Request, Response } from 'express'
import NonAssociationsService from '../../../../services/nonAssociationsService'

export default class ConfirmNonAssociationRoutes {
  constructor(private readonly nonAssociationsService: NonAssociationsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { nonAssociationsRemainingCount } = req.query
    const { prisoners } = req.session.appointmentJourney
    const { user } = res.locals

    let enhancedNonAssociations
    if (!nonAssociationsRemainingCount) {
      const prisonerNumbers = prisoners.map(prisoner => prisoner.number)
      const nonAssociations = await this.nonAssociationsService.getNonAssociationsBetween(prisonerNumbers, user)
      enhancedNonAssociations = await this.nonAssociationsService.enhanceNonAssociations(nonAssociations, user)
    }

    return res.render('pages/appointments/create-and-edit/confirm-non-associations', {
      backLinkHref: 'review-non-associations',
      nonAssociationsCount: Number(nonAssociationsRemainingCount) || enhancedNonAssociations.length,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirectOrReturn('name')
  }
}
