import { Request, Response } from 'express'
import MetricsEvent from '../../../../data/metricsEvent'
import MetricsService from '../../../../services/metricsService'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { formatName } from '../../../../utils/utils'
import { NameFormatStyle } from '../../../../utils/helpers/nameFormatStyle'
import config from '../../../../config'
import { YesNo } from '../../../../@types/activities'

export type ConfirmationAction = {
  href: string
  text: string
  dataQa: string
}

export default class ConfirmationRoutes {
  constructor(private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { appointmentJourney } = req.journeyData

    this.metricsService.trackEvent(
      MetricsEvent.CREATE_APPOINTMENT_JOURNEY_COMPLETED(appointment, req, res.locals.user, appointmentJourney),
    )

    const actions = this.getActions(req.params.journeyId as string, appointmentJourney, appointment)
    this.prepareNextJourney(req, appointment.attendees)

    res.render('pages/appointments/create-and-edit/confirmation', { appointment, appointmentJourney, actions })

    req.session.journeyMetrics = null
  }

  GET_SET = async (req: Request, res: Response) => {
    const { appointmentSet } = req
    const { appointmentJourney } = req.journeyData

    this.metricsService.trackEvent(
      MetricsEvent.CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED(appointmentSet, req, res.locals.user),
    )

    const actions = this.getActions(req.params.journeyId as string, appointmentJourney, undefined, appointmentSet)
    this.prepareNextJourney(
      req,
      appointmentSet.appointments.flatMap(appointment => appointment.attendees),
    )

    res.render('pages/appointments/create-and-edit/confirmation', { appointmentSet, appointmentJourney, actions })

    req.session.journeyMetrics = null
  }

  private getActions(
    journeyId: string,
    appointmentJourney: AppointmentJourney,
    appointment?: AppointmentDetails,
    appointmentSet?: AppointmentSetDetails,
  ): ConfirmationAction[] {
    const attendees = appointment?.attendees ?? appointmentSet?.appointments.flatMap(item => item.attendees) ?? []
    const actions: ConfirmationAction[] = [
      {
        href: '/appointments',
        text: 'Schedule an appointment',
        dataQa: 'create-another-link',
      },
    ]

    if (attendees.length === 1) {
      const { prisoner } = attendees[0]
      const prisonerName = formatName(
        prisoner.firstName,
        undefined,
        prisoner.lastName,
        NameFormatStyle.firstLast,
        false,
      )
      const possessiveName = `${prisonerName}${prisonerName.toLowerCase().endsWith('s') ? '’' : '’s'}`

      actions.push(
        {
          href: `/appointments/create/${journeyId}/name`,
          text: `Schedule another appointment for ${prisonerName}`,
          dataQa: 'create-another-for-prisoner-link',
        },
        {
          href: `${config.prisonerUrl}/prisoner/${prisoner.prisonerNumber}`,
          text: `Go to ${possessiveName} prisoner profile`,
          dataQa: 'prisoner-profile-link',
        },
      )
    }

    if (appointmentSet) {
      actions.push({
        href: `/appointments/set/${appointmentSet.id}`,
        text: 'View, print movement slips and manage this set of appointments',
        dataQa: 'view-appointment-link',
      })
    } else if (appointmentJourney.retrospective === YesNo.YES) {
      actions.push({
        href: `/appointments/attendance/${appointment.id}/select-appointment`,
        text: 'Record appointment attendance',
        dataQa: 'record-attendance-link',
      })
    } else {
      actions.push({
        href: `/appointments/${appointment.id}`,
        text: 'View, manage and print a movement slip for this appointment',
        dataQa: 'view-appointment-link',
      })
    }

    return actions
  }

  private prepareNextJourney(req: Request, attendees: AppointmentDetails['attendees']): void {
    req.journeyData.appointmentSetJourney = null

    if (attendees.length !== 1) {
      req.journeyData.appointmentJourney = null
      return
    }

    const { prisoner } = attendees[0]
    req.journeyData.appointmentJourney = {
      mode: AppointmentJourneyMode.CREATE,
      type: AppointmentType.GROUP,
      createJourneyComplete: false,
      prisoners: [
        {
          number: prisoner.prisonerNumber,
          name: `${prisoner.firstName} ${prisoner.lastName}`,
          firstName: prisoner.firstName,
          lastName: prisoner.lastName,
          prisonCode: prisoner.prisonCode,
          status: prisoner.status,
          cellLocation: prisoner.cellLocation,
          category: prisoner.category,
        },
      ],
      fromAppointmentConfirmation: true,
    }
  }
}
