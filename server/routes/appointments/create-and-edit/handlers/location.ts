import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentUtils from '../../../../utils/helpers/editAppointmentUtils'
import { AppointmentJourney, AppointmentJourneyMode } from '../appointmentJourney'

export class Location {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  locationId: number
}

export default class LocationRoutes {
  private readonly editAppointmentUtils: EditAppointmentUtils

  constructor(private readonly activitiesService: ActivitiesService) {
    this.editAppointmentUtils = new EditAppointmentUtils(activitiesService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session
    const { appointmentId, occurrenceId } = req.params
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    res.render('pages/appointments/create-and-edit/location', {
      locations,
      appointmentId,
      occurrenceId,
      isCtaAcceptAndSave:
        appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !this.editAppointmentUtils.isApplyToQuestionRequired(appointmentJourney),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session

    const location = await this.getLocation(req, res)
    if (!location) return

    appointmentJourney.location = {
      id: location.id,
      description: location.description,
    }

    res.redirectOrReturn(`date-and-time`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session
    const { appointmentId, occurrenceId } = req.params
    const { locationId } = req.body

    if (appointmentJourney.location.id === locationId) {
      res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
    } else {
      const location = await this.getLocation(req, res)
      if (!location) return

      appointmentJourney.location = {
        id: location.id,
        description: location.description,
      }

      appointmentJourney.updatedProperties = ['location']

      await this.editAppointmentUtils.redirectOrEdit(
        +appointmentId,
        +occurrenceId,
        appointmentJourney,
        'location',
        user,
        res,
      )
    }
  }

  private getLocation = async (req: Request, res: Response) => {
    const { locationId } = req.body
    const { user } = res.locals

    const location = await this.activitiesService
      .getAppointmentLocations(user.activeCaseLoadId, user)
      .then(locations => locations.find(l => l.id === locationId))

    if (!location) {
      res.validationFailed('locationId', `Selected location not found`)
      return false
    }

    return location
  }
}
