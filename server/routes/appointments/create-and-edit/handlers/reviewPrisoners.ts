import { Request, Response } from 'express'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import config from '../../../../config'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import PrisonService from '../../../../services/prisonService'
import { profileAlertCodes } from './alertFlagValues'
import { Alert } from '../../../../@types/prisonApiImport/types'

export default class ReviewPrisonerRoutes {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney, appointmentSetJourney, editAppointmentJourney } = req.session
    const { preserveHistory } = req.query

    let backLinkHref =
      appointmentJourney.type === AppointmentType.SET ? 'upload-appointment-set' : 'how-to-add-prisoners'
    if (appointmentJourney.fromPrisonNumberProfile) {
      backLinkHref = `${config.dpsUrl}/prisoner/${appointmentJourney.fromPrisonNumberProfile}`
    }

    let prisoners
    if (appointmentJourney.mode === AppointmentJourneyMode.EDIT) {
      prisoners = editAppointmentJourney.addPrisoners

      const metricsEvent = MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(appointmentJourney.mode, 'attendees', user)
      this.metricsService.trackEvent(metricsEvent)
    } else if (appointmentJourney.type === AppointmentType.SET) {
      prisoners = appointmentSetJourney.appointments.map(appointment => appointment.prisoner)
    } else {
      prisoners = appointmentJourney.prisoners
    }

    res.render('pages/appointments/create-and-edit/review-prisoners', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      prisoners,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    const prisonerCode = res.locals.user.activeCaseLoadId
    if (req.session.appointmentJourney.type === AppointmentType.SET) {
      // Call POST Prison API endpoint
      const offenderNumbersSet = req.session.appointmentSetJourney.appointments
        .map(value => value.prisoner)
        .map(value => value.number)
      const prisonerAlertsSet = await this.prisonService.getPrisonerAlerts(
        offenderNumbersSet,
        prisonerCode,
        res.locals.user,
      )

      if (prisonerAlertsSet.length > 0) {
        req.session.appointmentSetJourney.appointments = req.session.appointmentSetJourney.appointments.map(
          appointment => {
            const relevantSetAlerts = prisonerAlertsSet.filter(
              alert => alert.offenderNo === appointment.prisoner.number && !alert.expired && alert.active,
            )

            // Group alerts by category
            const alertsGroupedByCategory = relevantSetAlerts.reduce((acc, alert) => {
              const categoryKey = alert.alertType
              // Find the category object in the accumulator or create a new one
              const categoryObj = acc.find(item => item.category === categoryKey)
              if (categoryObj) {
                // Add the alert to the existing category
                categoryObj.alerts.push({
                  alertCode: alert.alertCode,
                  alertType: alert.alertType,
                })
                // Sort alerts within the category by alertCode
                categoryObj.alerts.sort(
                  (
                    a: { alertCode: string },
                    b: {
                      alertCode: string
                    },
                  ) => a.alertCode.localeCompare(b.alertCode),
                )
              } else {
                // Create a new category object
                acc.push({
                  category: categoryKey,
                  alerts: [
                    {
                      alertCode: alert.alertCode,
                      alertType: alert.alertType,
                    },
                  ],
                })
              }
              return acc
            }, [])

            const allAlertDescriptions = relevantSetAlerts
              .map(alert => alert.alertCodeDescription)
              .sort((a, b) => a.localeCompare(b))
            const alertExists = relevantSetAlerts.some(alert => profileAlertCodes.includes(alert.alertCode)) || false

            // Update the prisoner object within each appointment
            return {
              ...appointment,
              prisoner: {
                ...appointment.prisoner,
                alertCodes: alertsGroupedByCategory,
                alertDescriptions: allAlertDescriptions,
                profileAlertExists: alertExists,
              },
            }
          },
        )

        return res.redirectOrReturn('review-prisoners-alerts')
      }
    } else {
      const offenderNumbers: string[] = req.session.appointmentJourney.prisoners.map(value => value.number)
      const pAlerts: Alert[] = await this.prisonService.getPrisonerAlerts(
        offenderNumbers,
        prisonerCode,
        res.locals.user,
      )

      if (pAlerts.length > 0) {
        req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.map(offender => {
          const relevantAlerts = pAlerts.filter(
            alert => alert.offenderNo === offender.number && !alert.expired && alert.active,
          )

          // Group alerts by category
          const alertsGroupedByCategory = relevantAlerts.reduce((acc, alert) => {
            const categoryKey = alert.alertType
            // Find the category object in the accumulator or create a new one
            const categoryObj = acc.find(item => item.category === categoryKey)
            if (categoryObj) {
              // Add the alert to the existing category
              categoryObj.alerts.push({
                alertCode: alert.alertCode,
                alertType: alert.alertType,
              })
              // Sort alerts within the category by alertCode
              categoryObj.alerts.sort(
                (
                  a: { alertCode: string },
                  b: {
                    alertCode: string
                  },
                ) => a.alertCode.localeCompare(b.alertCode),
              )
            } else {
              // Create a new category object
              acc.push({
                category: categoryKey,
                alerts: [
                  {
                    alertCode: alert.alertCode,
                    alertType: alert.alertType,
                  },
                ],
              })
            }
            return acc
          }, [])

          const allAlertDescriptions = relevantAlerts
            .map(alert => alert.alertCodeDescription)
            .sort((a, b) => a.localeCompare(b))
          const alertExists = relevantAlerts.some(alert => profileAlertCodes.includes(alert.alertCode)) || false
          return {
            number: offender.number,
            name: offender.name,
            status: offender.status,
            prisonCode: offender.prisonCode,
            cellLocation: offender.cellLocation,
            alertCodes: alertsGroupedByCategory,
            alertDescriptions: allAlertDescriptions,
            profileAlertExists: alertExists,
          }
        })
        return res.redirectOrReturn('review-prisoners-alerts')
      }
    }
    return res.redirectOrReturn('name')
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    // Call POST Prison API endpoint
    const offenderNumbers = req.session.editAppointmentJourney.addPrisoners.map(value => value.number)
    const prisonerCode = res.locals.user.activeCaseLoadId
    const prisonerAlerts = await this.prisonService.getPrisonerAlerts(offenderNumbers, prisonerCode, res.locals.user)

    if (prisonerAlerts.length > 0) {
      req.session.editAppointmentJourney.addPrisoners = req.session.editAppointmentJourney.addPrisoners.map(
        offender => {
          const relevantAlerts = prisonerAlerts.filter(
            alert => alert.offenderNo === offender.number && !alert.expired && alert.active,
          )
          // Group alerts by category
          const alertsGroupedByCategory = relevantAlerts.reduce((acc, alert) => {
            const categoryKey = alert.alertType
            // Find the category object in the accumulator or create a new one
            const categoryObj = acc.find(item => item.category === categoryKey)
            if (categoryObj) {
              // Add the alert to the existing category
              categoryObj.alerts.push({
                alertCode: alert.alertCode,
                alertType: alert.alertType,
              })
              // Sort alerts within the category by alertCode
              categoryObj.alerts.sort(
                (
                  a: { alertCode: string },
                  b: {
                    alertCode: string
                  },
                ) => a.alertCode.localeCompare(b.alertCode),
              )
            } else {
              // Create a new category object
              acc.push({
                category: categoryKey,
                alerts: [
                  {
                    alertCode: alert.alertCode,
                    alertType: alert.alertType,
                  },
                ],
              })
            }
            return acc
          }, [])
          const allAlertDescriptions = relevantAlerts
            .map(alert => alert.alertCodeDescription)
            .sort((a, b) => a.localeCompare(b))
          const alertExists = relevantAlerts.some(alert => profileAlertCodes.includes(alert.alertCode)) || false
          return {
            number: offender.number,
            name: offender.name,
            status: offender.status,
            prisonCode: offender.prisonCode,
            cellLocation: offender.cellLocation,
            alertCodes: alertsGroupedByCategory,
            alertDescriptions: allAlertDescriptions,
            profileAlertExists: alertExists,
          }
        },
      )
      return res.redirectOrReturn('review-prisoners-alerts')
    }

    return res.redirect('../../schedule')
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    if (req.session.appointmentJourney.type === AppointmentType.SET) {
      req.session.appointmentSetJourney.appointments = req.session.appointmentSetJourney.appointments.filter(
        appointment => appointment.prisoner.number !== prisonNumber,
      )
    } else {
      req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
        prisoner => prisoner.number !== prisonNumber,
      )
    }

    res.redirect(`../../review-prisoners-alerts${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  EDIT_REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.editAppointmentJourney.addPrisoners = req.session.editAppointmentJourney.addPrisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect('../../review-prisoners-alerts')
  }
}
