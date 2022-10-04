import { Request, Response } from 'express'
import { PrisonerSchedule } from '../../../@types/prisonApiImport/types'

export default class ActivityListRouteHandler {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityList } = res.locals

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const mapToGovukTableRow = (ps: PrisonerSchedule): any => [
      {
        text: `${ps.lastName.charAt(0) + ps.lastName.substring(1).toLowerCase()}, ${
          ps.firstName.charAt(0) + ps.firstName.substring(1).toLowerCase()
        }`,
        attributes: { 'data-sort-value': ps.lastName },
      },
      {
        text: ps.cellLocation,
      },
      {
        text: ps.offenderNo,
      },
    ]

    const viewContext = {
      rowData: activityList.map(mapToGovukTableRow),
    }
    res.render('pages/activityList/index', viewContext)
  }
}
