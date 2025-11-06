import { Request, Response } from 'express'
import _ from 'lodash'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'

export default class MultipleNotAttendedReasonRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const selectedAttendances = req.journeyData.recordAttendanceJourney.selectedInstanceIds as string[]

    const instanceIds = _.uniq(
      selectedAttendances.flatMap(selectedAttendance => selectedAttendance.split('-')[0].split(',')),
    ).map(Number)
    const prisonerNumbers = _.uniq(selectedAttendances.map(selectedAttendance => selectedAttendance.split('-')[2]))

    const allInstances = await this.activitiesService.getScheduledActivities(instanceIds, user)
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)
    const notAttendedReasons = (await this.activitiesService.getAttendanceReasons(user))
      .filter(r => r.displayInAbsence)
      .sort((r1, r2) => r1.displaySequence - r2.displaySequence)

    const attendanceDetails = selectedAttendances.map(selectedAttendance => {
      const prisonerInstanceIds = selectedAttendance.split('-')[0].split(',').map(Number)
      const prisonerNumber = selectedAttendance.split('-')[2]

      const prisoner = prisoners.find(p => p.prisonerNumber === prisonerNumber)
      const instances = allInstances.filter(i => prisonerInstanceIds.includes(i.id))

      const filteredInstances = instances.filter(instance => {
        const attendance = instance.attendances.find(a => a.prisonerNumber === prisonerNumber)
        return !instance.cancelled && attendance && attendance.status === 'WAITING'
      })
      return {
        prisonerNumber,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        instances: filteredInstances,
        isPayable: instances.some(i => i.activitySchedule.activity.paid),
      }
    })

    return res.render('pages/activities/record-attendance/attend-all/multiple-not-attended-reason', {
      attendanceDetails,
      notAttendedReasons,
      backLink: req.journeyData.recordAttendanceJourney.returnUrl || 'choose-details-by-residential-location',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('multiple-not-attended-reason')
  }
}
