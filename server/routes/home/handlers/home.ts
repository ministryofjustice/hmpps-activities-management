import { Request, Response } from 'express'
// import AuthRole from '../../../enumeration/authRole'
// import { hasRole } from '../../../utils/utils'

export default class HomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const viewContext = {
      // shouldShowCreateLicenceCard: hasRole(req.user, AuthRole.RESPONSIBLE_OFFICER),
      // shouldShowVaryLicenceCard: hasRole(req.user, AuthRole.RESPONSIBLE_OFFICER),
      shouldShowCreateActivityCard: true,
      shouldShowPrisonCalendarCard: true,
      shouldShowAlphaPrisonActivityListAm: user.activeCaseLoad.isRolledOut,
      shouldShowAlphaPrisonActivityListDps: !user.activeCaseLoad.isRolledOut,
    }
    res.render('pages/index', viewContext)
  }
}
