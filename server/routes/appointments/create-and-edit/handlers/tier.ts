import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'

export class TierForm {
  @Expose()
  @IsEnum(EventTier, { message: 'Select an appointment tier' })
  tier: string
}

export default class TierRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render(`pages/appointments/create-and-edit/tier`, { eventTierDescriptions })

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { tier }: TierForm = req.body
    const { preserveHistory } = req.query

    req.session.appointmentJourney.tierCode = tier

    if (EventTier.TIER_2 === tier) {
      return res.redirect(`host${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
    req.session.appointmentJourney.organiserCode = null

    return res.redirectOrReturn('location')
  }
}
