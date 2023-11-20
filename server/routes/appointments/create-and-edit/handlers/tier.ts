import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourneyMode } from '../appointmentJourney'
import { isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class TierForm {
  @Expose()
  @IsEnum(EventTier, { message: 'Select an appointment tier' })
  tier: string
}

export default class TierRoutes {
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render(`pages/appointments/create-and-edit/tier`, {
      eventTierDescriptions,
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
    })

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { tier }: TierForm = req.body
    const { preserveHistory } = req.query

    req.session.appointmentJourney.tierCode = EventTier[tier]

    if (EventTier.TIER_2 === tier) {
      return res.redirect(`host${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
    req.session.appointmentJourney.organiserCode = null

    return res.redirectOrReturn('location')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { tier }: TierForm = req.body
    const { preserveHistory } = req.query

    req.session.editAppointmentJourney.tierCode = EventTier[tier]

    if (EventTier.TIER_2 === tier) {
      return res.redirect(`host${preserveHistory ? '?preserveHistory=true' : ''}`)
    }

    return this.editAppointmentService.redirectOrEdit(req, res, 'tier')
  }
}
