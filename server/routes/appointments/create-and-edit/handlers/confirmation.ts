import { Request, Response } from 'express'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import { AppointmentJourney } from '../appointmentJourney'
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
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { appointmentJourney } = req.journeyData

    const actions = this.getActions(appointmentJourney, appointment)

    res.render('pages/appointments/create-and-edit/confirmation', { appointment, appointmentJourney, actions })
  }

  GET_SET = async (req: Request, res: Response) => {
    const { appointmentSet } = req
    const { appointmentJourney } = req.journeyData

    const actions = this.getActions(appointmentJourney, undefined, appointmentSet)

    res.render('pages/appointments/create-and-edit/confirmation', { appointmentSet, appointmentJourney, actions })
  }

  private getActions(
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
          href: `/appointments/create/start-prisoner/${prisoner.prisonerNumber}/name`,
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
        text:
          attendees.length > 1
            ? 'View, manage and print a movement slips for this appointment'
            : 'View, manage and print a movement slip for this appointment',
        dataQa: 'view-appointment-link',
      })
    }

    return actions
  }
}
