import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import { AppointmentCreateRequest, BulkAppointmentsRequest } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { AppointmentType } from '../appointmentJourney'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    req.session.appointmentJourney.journeyComplete = true
    res.render('pages/appointments/create-and-edit/check-answers')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session

    let response
    if (appointmentJourney.type === AppointmentType.BULK) {
      const request = this.createBulkAppointmentRequest(req, res)
      response = await this.activitiesService.createBulkAppointment(request, user)
      res.redirect(`bulk-appointments-confirmation/${response.id}`)
    } else {
      const request = this.createAppointmentRequest(req, res)
      response = await this.activitiesService.createAppointment(request, user)
      res.redirect(`confirmation/${response.id}`)
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
      appointmentDescription: appointmentJourney.description,
      internalLocationId: appointmentJourney.location.id,
      inCell: false,
      startDate: plainToInstance(SimpleDate, appointmentJourney.startDate).toIsoString(),
      startTime: plainToInstance(SimpleTime, appointmentJourney.startTime).toIsoString(),
      endTime: plainToInstance(SimpleTime, appointmentJourney.endTime).toIsoString(),
      comment: appointmentJourney.comment,
    } as AppointmentCreateRequest

    if (appointmentJourney.repeat === YesNo.YES) {
      request.repeat = {
        period: appointmentJourney.repeatPeriod,
        count: appointmentJourney.repeatCount,
      }
    }

    return request
  }

  private createBulkAppointmentRequest(req: Request, res: Response) {
    const { user } = res.locals
    const { appointmentJourney, bulkAppointmentJourney } = req.session

    return {
      prisonCode: user.activeCaseLoadId,
      categoryCode: appointmentJourney.category.code,
      appointmentDescription: appointmentJourney.description,
      internalLocationId: appointmentJourney.location.id,
      inCell: false,
      startDate: plainToInstance(SimpleDate, appointmentJourney.startDate).toIsoString(),
      appointments: bulkAppointmentJourney.appointments.map(appointment => ({
        prisonerNumber: appointment.prisoner.number,
        startTime: plainToInstance(SimpleTime, appointment.startTime).toIsoString(),
        endTime: plainToInstance(SimpleTime, appointment.endTime).toIsoString(),
        comment: appointment.comment,
      })),
    } as BulkAppointmentsRequest
  }
}
