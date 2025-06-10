import { Request, Response } from 'express'
import config from '../../../../config'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import NonAssociationsService from '../../../../services/nonAssociationsService'

export default class PrisonerAllocationsHandler {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerNonAssociations = await this.nonAssociationsService.getNonAssociationByPrisonerId(
      prisonerNumber,
      user,
    )

    const hasNonAssociations =
      prisonerNonAssociations.nonAssociations.length > 0 &&
      prisonerNonAssociations.nonAssociations.some(na => na.isOpen)

    return res.render('pages/activities/prisoner-allocations/dashboard', { prisoner, hasNonAssociations })
  }

  POST = async (req: Request, res: Response) => {
    res.redirect('/activities/prisoner-allocations')
  }
}
