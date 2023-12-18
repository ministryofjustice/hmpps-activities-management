import { Request, Response } from 'express'
import ActivitiesService from './activitiesService'

export default function activeRolledPrisons(activitiesService: ActivitiesService) {
  return (req: Request, res: Response) =>
    activitiesService.getRolledOutPrisons().then(r => {
      const activeAgencies = r
        .filter(item => item.activitiesRolledOut && item.appointmentsRolledOut)
        .map(item => item.prisonCode)
      res.json({ activeAgencies })
    })
}
