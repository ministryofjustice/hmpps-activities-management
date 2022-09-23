import { Request, Response } from 'express'
import PrisonService from '../../../services/prisonService'
import { PrisonerSearchCriteria } from '../../../@types/prisonerOffenderSearchImport/types'

export default class PrisonServiceSpikeRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonId, nomisId, lastNameToSearch } = req.query as Record<string, string>

    const [prisonDescription, inmateDetail, inmatesSearchResults] = await Promise.all([
      this.prisonService.getPrison(prisonId || 'MDI', user),
      this.prisonService.getInmate(nomisId || 'A7814DY', user),
      this.prisonService.searchInmates({ lastName: lastNameToSearch || 'Smith' } as PrisonerSearchCriteria, user),
    ])

    const viewContext = {
      prisonDescription,
      inmateDetail,
      inmatesSearchResults,
    }

    res.render('pages/spikes/prisonServiceSpike', viewContext)
  }
}
