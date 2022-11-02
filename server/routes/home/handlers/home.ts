import { Request, Response } from 'express'

export default class HomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const viewContext = {
      shouldShowAlphaPrisonActivityListAm: user.activeCaseLoad.isRolledOut,
      shouldShowAlphaPrisonActivityListDps: !user.activeCaseLoad.isRolledOut,
    }
    res.render('pages/home/index', viewContext)
  }
}
