import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { AppointmentSeriesCreateRequest, AppointmentSetCreateRequest } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { AppointmentType } from '../appointmentJourney'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney.createJourneyComplete = true
    res.render('pages/appointments/create-and-edit/check-answers')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session

    let response
    if (appointmentJourney.type === AppointmentType.SET) {
      const request = this.createAppointmentSetRequest(req, res)
      response = await this.activitiesService.createAppointmentSet(request, user)
      res.redirect(`set-confirmation/${response.id}`)
    } else {
      const request = this.createAppointmentRequest(req, res)
      response = await this.activitiesService.createAppointmentSeries(request, user)
      res.redirect(`confirmation/${response.appointments[0].id}`)
    }
  }

  private createAppointmentRequest(req: Request, res: Response) {
    const { user } = res.locals
    const { appointmentJourney } = req.session

    const request = {
      appointmentType: appointmentJourney.type,
      prisonCode: user.activeCaseLoadId,
      prisonerNumbers: appointmentJourney.prisoners.map(p => p.number),
      categoryCode: appointmentJourney.category.code,
      customName: appointmentJourney.customName,
      internalLocationId: appointmentJourney.location.id,
      inCell: false,
      startDate: appointmentJourney.startDate,
      startTime: plainToInstance(SimpleTime, appointmentJourney.startTime).toIsoString(),
      endTime: plainToInstance(SimpleTime, appointmentJourney.endTime).toIsoString(),
      extraInformation: appointmentJourney.extraInformation,
    } as AppointmentSeriesCreateRequest

    if (appointmentJourney.repeat === YesNo.YES) {
      request.schedule = {
        frequency: appointmentJourney.frequency,
        numberOfAppointments: appointmentJourney.numberOfAppointments,
      }
    }

    return request
  }

  private createAppointmentSetRequest(req: Request, res: Response) {
    const { user } = res.locals
    const { appointmentJourney, appointmentSetJourney } = req.session

    return {
      prisonCode: user.activeCaseLoadId,
      categoryCode: appointmentJourney.category.code,
      customName: appointmentJourney.customName,
      internalLocationId: appointmentJourney.location.id,
      inCell: false,
      startDate: appointmentJourney.startDate,
      appointments: appointmentSetJourney.appointments.map(appointment => ({
        prisonerNumber: appointment.prisoner.number,
        startTime: plainToInstance(SimpleTime, appointment.startTime).toIsoString(),
        endTime: plainToInstance(SimpleTime, appointment.endTime).toIsoString(),
        extraInformation: appointment.extraInformation,
      })),
    } as AppointmentSetCreateRequest
  }
}
