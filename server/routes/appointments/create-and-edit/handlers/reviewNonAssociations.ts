import { Request, Response } from 'express'
import NonAssociationsService from '../../../../services/nonAssociationsService'

export default class ReviewNonAssociationRoutes {
  constructor(private readonly nonAssociationsService: NonAssociationsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney } = req.session
    const { preserveHistory } = req.query

    const backLinkHref = 'review-prisoners-alerts'

    const { prisoners } = appointmentJourney
    const prisonerNumbers = prisoners.map(prisoner => prisoner.number)

    const nonAssociations = await this.nonAssociationsService.getNonAssociationsBetween(prisonerNumbers, user)

    res.render('pages/appointments/create-and-edit/review-non-associations', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      nonAssociations,
    })
  }
}
