import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { EditApplyTo } from '../../../../@types/appointments'

export class Location {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Select a location' })
  @IsNumber({ allowNaN: false }, { message: 'Select a location' })
  locationId: number
}

export default class LocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    res.render('pages/appointments/create-and-edit/location', {
      locations,
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const location = await this.getLocation(req, res)
    if (!location) return

    req.session.appointmentJourney.location = {
      id: location.id,
      description: location.description,
    }

    res.redirectOrReturn(`date-and-time`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId, occurrenceId } = req.params

    const result = await this.getLocation(req, res)
    if (!result) return

    await this.activitiesService.editAppointmentOccurrence(
      +occurrenceId,
      {
        internalLocationId: result.id,
        applyTo: EditApplyTo.THIS_OCCURRENCE,
      },
      user,
    )

    req.flash(
      'successMessage',
      JSON.stringify({
        message: `Appointment location for this occurrence changed successfully`,
      }),
    )

    res.redirectOrReturn(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
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
