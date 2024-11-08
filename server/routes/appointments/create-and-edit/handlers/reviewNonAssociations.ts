import { Request, Response } from 'express'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import PrisonService from '../../../../services/prisonService'

export default class ReviewNonAssociationRoutes {
  constructor(
    private readonly nonAssociationsService: NonAssociationsService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney } = req.session
    const { preserveHistory, prisonerRemoved } = req.query
    const backLinkHref = 'review-prisoners-alerts'
    const { prisoners } = appointmentJourney

    // If there is only one prisoner added to the appointment, non-associations are impossible so there is no point calling the endpoint
    // But if the user has just removed a non-association and now there's only one person left,
    // we don't want to redirect straight away - but istead display the alternative message
    if (prisoners.length < 2) {
      if (prisonerRemoved) {
        return res.render('pages/appointments/create-and-edit/review-non-associations', {
          appointmentId,
          backLinkHref,
          preserveHistory,
          nonAssociations: [],
          attendeesTotalCount: prisoners.length,
        })
      }
      return res.redirect('name')
    }

    const prisonerNumbers = prisoners.map(prisoner => prisoner.number)
    const nonAssociations = await this.nonAssociationsService.getNonAssociationsBetween(prisonerNumbers, user)

    // If there are no non-associations, and it isn't because a user has removed them via this page, redirect
    if (!nonAssociations.length && !prisonerRemoved) return res.redirect('name')
    const enhancedNonAssociations = await this.nonAssociationsService.enhanceNonAssociations(nonAssociations, user)

    return res.render('pages/appointments/create-and-edit/review-non-associations', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      nonAssociations: enhancedNonAssociations,
      attendeesTotalCount: prisonerNumbers.length,
    })
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect(
      `../../review-non-associations?prisonerRemoved=true${req.query.preserveHistory ? '&preserveHistory=true' : ''}`,
    )
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { nonAssociationsRemainingCount } = req.body
    if (nonAssociationsRemainingCount > 0) {
      return res.redirectOrReturn(
        `confirm-non-associations?nonAssociationsRemainingCount=${nonAssociationsRemainingCount}`,
      )
    }
    return res.redirectOrReturn('name')
  }

  EDIT_GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney, editAppointmentJourney } = req.session
    const { preserveHistory, prisonerRemoved } = req.query
    const backLinkHref = 'review-prisoners-alerts'
    const { prisoners } = appointmentJourney
    const { addPrisoners } = editAppointmentJourney

    if (!addPrisoners.length) {
      return res.render('pages/appointments/create-and-edit/review-non-associations-edit', {
        appointmentId,
        backLinkHref,
        preserveHistory,
        nonAssociations: [],
        additionalAttendeesCount: 0,
      })
    }
    const allAttendees = [...prisoners, ...addPrisoners]
    const allAttendeesPrisonerNumbers = Array.from(new Set(allAttendees.map(prisoner => prisoner.number)))
    let nonAssociations = []
    if (allAttendeesPrisonerNumbers.length > 1) {
      nonAssociations = await this.nonAssociationsService.getNonAssociationsBetween(allAttendeesPrisonerNumbers, user)
    }

    // If there are no non-associations, and it isn't because a user has removed them via this page, redirect
    if (!nonAssociations.length && !prisonerRemoved) return res.redirect('../../schedule')
    const enhancedNonAssociations = await this.nonAssociationsService.enhanceNonAssociations(nonAssociations, user)

    const additionalPrisonersNumbers = addPrisoners.map(prisoner => prisoner.number)

    const enhancedNonAssociationsOfAddedPrisoners = enhancedNonAssociations.filter(nonAssoc =>
      additionalPrisonersNumbers.includes(nonAssoc.primaryPrisoner.prisonerNumber),
    )

    return res.render('pages/appointments/create-and-edit/review-non-associations-edit', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      nonAssociations: enhancedNonAssociationsOfAddedPrisoners,
      existingAttendeesCount: prisoners.length,
      additionalAttendeesCount: addPrisoners.length,
      existingPrisonerNumbers: prisoners.map(prisoner => prisoner.number),
    })
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    return res.redirectOrReturn('../../schedule')
  }

  EDIT_REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params
    req.session.editAppointmentJourney.addPrisoners = req.session.editAppointmentJourney.addPrisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect(`../../review-non-associations?prisonerRemoved=true`)
  }
}
