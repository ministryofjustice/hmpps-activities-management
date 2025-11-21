import { RequestHandler, Router } from 'express'
import SelectPeriodRoutes, { TimePeriod } from './handlers/selectPeriod'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ActivitiesRoutes from './handlers/activities'
import { Services } from '../../../services'
import AttendanceListRoutes, { AttendanceList } from './handlers/attendanceList'
import NotAttendedReasonRoutes, { NotAttendedForm } from './handlers/notAttendedReason'
import CancelSessionReasonRoutes, { CancelReasonForm } from './handlers/cancel-session/reason'
import CancelSessionConfirmationRoutes, { CancelConfirmForm } from './handlers/cancel-session/confirmation'
import UncancelSessionConfirmationRoutes, { UncancelConfirmForm } from './handlers/uncancel-session/confirmation'
import AttendanceDetailsRoutes from './handlers/attendanceDetails'
import EditAttendanceRoutes, { EditAttendance } from './handlers/editAttendance'
import RemovePayRoutes, { RemovePay } from './handlers/removePay'
import HomeRoutes from './handlers/home'
import ResetAttendanceRoutes, { ResetAttendance } from './handlers/resetAttendance'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import CancelMultipleSessionsReasonRoutes, {
  CancelReasonMultipleForm,
} from './handlers/cancel-multiple-sessions/reason'
import CancelMultipleSessionsPayRoutes, { SessionPayMultipleForm } from './handlers/cancel-multiple-sessions/payment'
import CancelMultipleSessionsCheckAnswersRoutes from './handlers/cancel-multiple-sessions/checkAnswers'
import UncancelMultipleSessionsConfirmRoutes, {
  UncancelMultipleConfirmForm,
} from './handlers/uncancel-multiple-sessions/confirmation'
import UncancelMultipleSessionsRoutes from './handlers/uncancel-multiple-sessions/activitiesList'
import CancelMultipleSessionsViewEditDetailsRoutes from './handlers/cancel-multiple-sessions/viewOrEditDetails'
import UpdateCancelledSessionPayRoutes, { CancelledSessionUpdatePayForm } from './handlers/cancel-session/updatePayment'
import PaidOrNotRoutes, { PayNotRequiredOrExcusedForm } from './handlers/not-required-or-excused/paidOrNot'
import CheckAndConfirmRoutes from './handlers/not-required-or-excused/checkAndConfirm'
import AdvanceAttendanceDetailsRoutes from './handlers/advanceAttendanceDetails'
import ResetAdvanceAttendanceRoutes from './handlers/resetAdvanceAttendance'
import AdvanceAttendanceChangePayRoutes from './handlers/advanceAttendanceChangePay'
import ChangePayRoutes from './handlers/not-required-or-excused/changePay'
import CancelSingleSessionsReasonRoutes, { CancelReasonSingleForm } from './handlers/cancel-single-session/reason'
import CancelSingleSessionPayRoutes, { SessionPaySingleForm } from './handlers/cancel-single-session/payment'
import CancelSingleSessionsCheckAnswersRoutes from './handlers/cancel-single-session/checkAnswers'
import setUpJourneyData from '../../../middleware/setUpJourneyData'
import HowToRecordAttendanceRoutes, { HowToRecordAttendanceForm } from './handlers/attend-all/howToRecordAttendance'
import ChooseDetailsToRecordAttendanceRoutes, {
  ChooseDetailsToRecordAttendanceForm,
} from './handlers/attend-all/chooseDetailsToRecordAttendance'
import SelectPeopleToRecordAttendanceForRoutes from './handlers/attend-all/selectPeopleToRecordAttendanceFor'
import ChooseDetailsByActivityLocationRoutes, {
  ChooseDetailsByActivityLocationForm,
} from './handlers/attend-all/chooseDetailsByActivityLocation'
import ListActivitiesRoutes from './handlers/attend-all/listActivities'
import ChooseDetailsByResidentialLocationRoutes, {
  ChooseDetailsByResidentialLocationForm,
} from './handlers/attend-all/chooseDetailsByResidentialLocation'
import SelectPeopleByResidentialLocationRoutes from './handlers/attend-all/selectPeopleByResidentialLocation'
import MultipleNotAttendedReasonRoutes, {
  MultipleNotAttendedReasonForm,
} from './handlers/attend-all/multipleNotAttendedReason'
import CancelSessionPayRoutes, { CancelSessionPayForm } from './handlers/cancel-session/payment'
import SelectAttendedRoutes, { SelectAttendedForm } from './handlers/attend-all/selectAttended'
import SelectNotRequiredRoutes, { SelectNotRequiredForm } from './handlers/attend-all/selectNotRequired'
import ApplyFiltersRoutes, { Filters } from './handlers/attend-all/applyFilters'

export default function Index({
  activitiesService,
  prisonService,
  userService,
  locationsService,
  tokenStore,
}: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      setUpJourneyData(tokenStore),
      emptyJourneyHandler('recordAttendanceJourney', stepRequiresSession),
      handler,
    )
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, setUpJourneyData(tokenStore), validationMiddleware(type), handler)

  const homeHandler = new HomeRoutes()
  const selectPeriodHandler = new SelectPeriodRoutes()
  const activitiesHandler = new ActivitiesRoutes(activitiesService, locationsService)
  const attendanceListHandler = new AttendanceListRoutes(activitiesService, prisonService, userService)
  const paidOrNotRoutes = new PaidOrNotRoutes(activitiesService)
  const checkAndConfirmRoutes = new CheckAndConfirmRoutes(activitiesService)
  const notAttendedReasonHandler = new NotAttendedReasonRoutes(activitiesService)
  const cancelSessionReasonRoutes = new CancelSessionReasonRoutes(activitiesService)
  const cancelledSessionPayRoutes = new CancelSessionPayRoutes()
  const updateCancelledSessionPayRoutes = new UpdateCancelledSessionPayRoutes(activitiesService)
  const cancelSessionConfirmationRoutes = new CancelSessionConfirmationRoutes(activitiesService)
  const uncancelSessionConfirmationRoutes = new UncancelSessionConfirmationRoutes(activitiesService)
  const attendanceDetailsHandler = new AttendanceDetailsRoutes(activitiesService, prisonService, userService)
  const changePayHandler = new ChangePayRoutes(activitiesService, prisonService)
  const advanceAttendanceDetailsHandler = new AdvanceAttendanceDetailsRoutes(
    activitiesService,
    prisonService,
    userService,
  )
  const resetAdvanceAttendanceHandler = new ResetAdvanceAttendanceRoutes(activitiesService, prisonService)
  const advanceAttendanceChangePayHandler = new AdvanceAttendanceChangePayRoutes(activitiesService, prisonService)
  const editAttendanceHandler = new EditAttendanceRoutes(activitiesService, prisonService)
  const removePayHandler = new RemovePayRoutes(activitiesService, prisonService)
  const resetAttendanceRoutes = new ResetAttendanceRoutes(activitiesService, prisonService)
  const cancelSingleSessionReasonRoutes = new CancelSingleSessionsReasonRoutes(activitiesService)
  const cancelSingleSessionPayRoutes = new CancelSingleSessionPayRoutes()
  const cancelSingleSessionsCheckAnswersRoutes = new CancelSingleSessionsCheckAnswersRoutes(activitiesService)
  const cancelMultipleSessionsReasonRoutes = new CancelMultipleSessionsReasonRoutes(activitiesService)
  const cancelMultipleSessionsPayRoutes = new CancelMultipleSessionsPayRoutes()
  const cancelMultipleSessionsCheckAnswersRoutes = new CancelMultipleSessionsCheckAnswersRoutes(activitiesService)
  const uncancelMultipleSessionsRoutes = new UncancelMultipleSessionsRoutes(activitiesService, locationsService)
  const uncancelMultipleSessionsConfirmRoutes = new UncancelMultipleSessionsConfirmRoutes(activitiesService)
  const cancelMultipleSessionsViewEditDetailsRoutes = new CancelMultipleSessionsViewEditDetailsRoutes(
    activitiesService,
    userService,
  )
  const howToRecordAttendanceRoutes = new HowToRecordAttendanceRoutes()
  const chooseDetailsToRecordAttendanceRoutes = new ChooseDetailsToRecordAttendanceRoutes(activitiesService)
  const chooseDetailsByActivityLocationRoutes = new ChooseDetailsByActivityLocationRoutes(locationsService)
  const chooseDetailsByResidentialLocationRoutes = new ChooseDetailsByResidentialLocationRoutes(activitiesService)
  const selectPeopleToRecordattendanceForRoutes = new SelectPeopleToRecordAttendanceForRoutes(
    activitiesService,
    prisonService,
    userService,
  )
  const selectPeopleByResidentialLocationRoutes = new SelectPeopleByResidentialLocationRoutes(
    activitiesService,
    prisonService,
    userService,
  )
  const multipleNotAttendedReasonRoutes = new MultipleNotAttendedReasonRoutes(activitiesService, prisonService)
  const selectAttendedRoutes = new SelectAttendedRoutes(activitiesService, prisonService)
  const selectNotRequiredRoutes = new SelectNotRequiredRoutes(activitiesService, prisonService)
  const attendAllListActivitiesRoutes = new ListActivitiesRoutes(activitiesService, locationsService)
  const applyFiltersRoutes = new ApplyFiltersRoutes()

  get('/', homeHandler.GET)

  router.use(insertJourneyIdentifier())

  get('/:journeyId/select-period', selectPeriodHandler.GET)
  post('/:journeyId/select-period', selectPeriodHandler.POST, TimePeriod)

  get('/:journeyId/activities', activitiesHandler.GET)
  post('/:journeyId/activities', activitiesHandler.POST)

  post('/:journeyId/activities/attendance-list', activitiesHandler.POST_ATTENDANCES)
  get('/:journeyId/activities/:id/attendance-list', attendanceListHandler.GET)
  get('/:journeyId/activities/attendance-list', attendanceListHandler.GET_ATTENDANCES, true)

  post('/:journeyId/activities/attended', attendanceListHandler.ATTENDED_MULTIPLE, AttendanceList)
  post('/:journeyId/activities/:id/attended', attendanceListHandler.ATTENDED, AttendanceList)

  post('/:journeyId/activities/:id/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)
  post('/:journeyId/activities/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)

  post(
    '/:journeyId/activities/:id/not-required-or-excused',
    attendanceListHandler.NOT_REQUIRED_OR_EXCUSED,
    AttendanceList,
  )
  get('/:journeyId/activities/:id/not-required-or-excused/paid-or-not', paidOrNotRoutes.GET, true)
  post(
    '/:journeyId/activities/:id/not-required-or-excused/paid-or-not',
    paidOrNotRoutes.POST,
    PayNotRequiredOrExcusedForm,
  )

  get('/:journeyId/activities/:id/not-required-or-excused/check-and-confirm', checkAndConfirmRoutes.GET, true)
  post('/:journeyId/activities/:id/not-required-or-excused/check-and-confirm', checkAndConfirmRoutes.POST)

  get('/:journeyId/activities/:id/advance-attendance-details/:advanceAttendanceId', advanceAttendanceDetailsHandler.GET)
  post(
    '/:journeyId/activities/:id/advance-attendance-details/:advanceAttendanceId',
    advanceAttendanceDetailsHandler.POST,
  )
  get(
    '/:journeyId/activities/:id/advance-attendance-details/:advanceAttendanceId/reset',
    resetAdvanceAttendanceHandler.GET,
  )
  post(
    '/:journeyId/activities/:id/advance-attendance-details/:advanceAttendanceId/reset',
    resetAdvanceAttendanceHandler.POST,
  )
  get(
    '/:journeyId/activities/:id/advance-attendance-details/:advanceAttendanceId/change-pay',
    advanceAttendanceChangePayHandler.GET,
  )
  post(
    '/:journeyId/activities/:id/advance-attendance-details/:advanceAttendanceId/change-pay',
    advanceAttendanceChangePayHandler.POST,
  )

  get('/:journeyId/activities/not-attended-reason', notAttendedReasonHandler.GET, true)
  post('/:journeyId/activities/not-attended-reason', notAttendedReasonHandler.POST, NotAttendedForm)

  get('/:journeyId/activities/:id/cancel', cancelSessionReasonRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel', cancelSessionReasonRoutes.POST, CancelReasonForm)
  get('/:journeyId/activities/:id/cancel/payment', cancelledSessionPayRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel/payment', cancelledSessionPayRoutes.POST, CancelSessionPayForm)
  get('/:journeyId/activities/:id/cancel/update-payment', updateCancelledSessionPayRoutes.GET, true)
  post(
    '/:journeyId/activities/:id/cancel/update-payment',
    updateCancelledSessionPayRoutes.POST,
    CancelledSessionUpdatePayForm,
  )
  get('/:journeyId/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.POST, CancelConfirmForm)
  get('/:journeyId/activities/:id/uncancel', uncancelSessionConfirmationRoutes.GET, true)
  post('/:journeyId/activities/:id/uncancel', uncancelSessionConfirmationRoutes.POST, UncancelConfirmForm)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.GET)
  post('/:journeyId/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.POST)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/change-pay', changePayHandler.GET)
  post('/:journeyId/activities/:id/attendance-details/:attendanceId/change-pay', changePayHandler.POST)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/edit-attendance', editAttendanceHandler.GET, true)
  post(
    '/:journeyId/activities/:id/attendance-details/:attendanceId/edit-attendance',
    editAttendanceHandler.POST,
    EditAttendance,
  )
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/remove-pay', removePayHandler.GET, true)
  post('/:journeyId/activities/:id/attendance-details/:attendanceId/remove-pay', removePayHandler.POST, RemovePay)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/reset-attendance', resetAttendanceRoutes.GET, true)
  post(
    '/:journeyId/activities/:id/attendance-details/:attendanceId/reset-attendance',
    resetAttendanceRoutes.POST,
    ResetAttendance,
  )

  post('/:journeyId/activities/cancel-single', activitiesHandler.POST_CANCELLATIONS)
  get('/:journeyId/activities/cancel-single/cancel-reason', cancelSingleSessionReasonRoutes.GET, true)
  post(
    '/:journeyId/activities/cancel-single/cancel-reason',
    cancelSingleSessionReasonRoutes.POST,
    CancelReasonSingleForm,
  )
  get('/:journeyId/activities/cancel-single/payment', cancelSingleSessionPayRoutes.GET, true)
  post('/:journeyId/activities/cancel-single/payment', cancelSingleSessionPayRoutes.POST, SessionPaySingleForm)
  get('/:journeyId/activities/cancel-single/check-answers', cancelSingleSessionsCheckAnswersRoutes.GET, true)
  post('/:journeyId/activities/cancel-single/check-answers', cancelSingleSessionsCheckAnswersRoutes.POST)

  post('/:journeyId/activities/cancel-multiple', activitiesHandler.POST_CANCELLATIONS)
  get('/:journeyId/activities/cancel-multiple/cancel-reason', cancelMultipleSessionsReasonRoutes.GET, true)
  post(
    '/:journeyId/activities/cancel-multiple/cancel-reason',
    cancelMultipleSessionsReasonRoutes.POST,
    CancelReasonMultipleForm,
  )
  get('/:journeyId/activities/cancel-multiple/payment', cancelMultipleSessionsPayRoutes.GET, true)
  post('/:journeyId/activities/cancel-multiple/payment', cancelMultipleSessionsPayRoutes.POST, SessionPayMultipleForm)
  get('/:journeyId/activities/cancel-multiple/check-answers', cancelMultipleSessionsCheckAnswersRoutes.GET, true)
  post('/:journeyId/activities/cancel-multiple/check-answers', cancelMultipleSessionsCheckAnswersRoutes.POST)

  get('/:journeyId/activities/uncancel-multiple', uncancelMultipleSessionsRoutes.GET, true)
  post('/:journeyId/activities/uncancel-multiple', uncancelMultipleSessionsRoutes.POST)
  post('/:journeyId/activities/uncancel-multiple/next', uncancelMultipleSessionsRoutes.POST_UNCANCEL)
  get('/:journeyId/activities/uncancel-multiple/confirm', uncancelMultipleSessionsConfirmRoutes.GET, true)
  post(
    '/:journeyId/activities/uncancel-multiple/confirm',
    uncancelMultipleSessionsConfirmRoutes.POST,
    UncancelMultipleConfirmForm,
  )

  get(
    '/:journeyId/activities/cancel-multiple/view-edit-details/:id',
    cancelMultipleSessionsViewEditDetailsRoutes.GET,
    true,
  )

  // Attend all routes
  get('/:journeyId/attend-all/how-to-record-attendance', howToRecordAttendanceRoutes.GET)
  post('/:journeyId/attend-all/how-to-record-attendance', howToRecordAttendanceRoutes.POST, HowToRecordAttendanceForm)
  get('/:journeyId/attend-all/choose-details-to-record-attendance', chooseDetailsToRecordAttendanceRoutes.GET)
  post(
    '/:journeyId/attend-all/choose-details-to-record-attendance',
    chooseDetailsToRecordAttendanceRoutes.POST,
    ChooseDetailsToRecordAttendanceForm,
  )
  get('/:journeyId/attend-all/choose-details-by-activity-location', chooseDetailsByActivityLocationRoutes.GET)
  post(
    '/:journeyId/attend-all/choose-details-by-activity-location',
    chooseDetailsByActivityLocationRoutes.POST,
    ChooseDetailsByActivityLocationForm,
  )
  get('/:journeyId/attend-all/choose-details-by-residential-location', chooseDetailsByResidentialLocationRoutes.GET)
  post(
    '/:journeyId/attend-all/choose-details-by-residential-location',
    chooseDetailsByResidentialLocationRoutes.POST,
    ChooseDetailsByResidentialLocationForm,
  )

  get('/:journeyId/attend-all/select-people-to-record-attendance-for', selectPeopleToRecordattendanceForRoutes.GET)
  get('/:journeyId/attend-all/select-people-by-residential-location', selectPeopleByResidentialLocationRoutes.GET)
  post(
    '/:journeyId/attend-all/select-people-by-residential-location/attended',
    selectPeopleByResidentialLocationRoutes.ATTENDED,
  )
  post(
    '/:journeyId/attend-all/select-people-by-residential-location/not-attended',
    selectPeopleByResidentialLocationRoutes.NOT_ATTENDED,
  )
  post(
    '/:journeyId/attend-all/select-people-by-residential-location/not-required-or-excused',
    selectPeopleByResidentialLocationRoutes.NOT_REQUIRED,
  )
  get('/:journeyId/attend-all/multiple-not-attended-reason', multipleNotAttendedReasonRoutes.GET)
  post(
    '/:journeyId/attend-all/multiple-not-attended-reason',
    multipleNotAttendedReasonRoutes.POST,
    MultipleNotAttendedReasonForm,
  )

  get('/:journeyId/attend-all/select-attended', selectAttendedRoutes.GET)
  post('/:journeyId/attend-all/select-attended', selectAttendedRoutes.POST, SelectAttendedForm)

  post('/:journeyId/attend-all/update-filters', applyFiltersRoutes.APPLY, Filters)

  get('/:journeyId/attend-all/select-not-required', selectNotRequiredRoutes.GET)
  post('/:journeyId/attend-all/select-not-required', selectNotRequiredRoutes.POST, SelectNotRequiredForm)

  post('/:journeyId/attend-all/attended', selectPeopleToRecordattendanceForRoutes.ATTENDED)
  post('/:journeyId/attend-all/not-attended', selectPeopleToRecordattendanceForRoutes.NOT_ATTENDED)
  post(
    '/:journeyId/attend-all/not-required-or-excused',
    selectPeopleToRecordattendanceForRoutes.NOT_REQUIRED_OR_EXCUSED,
  )

  get('/:journeyId/attend-all/list-activities', attendAllListActivitiesRoutes.GET)
  post('/:journeyId/attend-all/list-activities', attendAllListActivitiesRoutes.POST)
  post('/:journeyId/attend-all/list-activities/record-or-edit', attendAllListActivitiesRoutes.RECORD_OR_EDIT_ATTENDANCE)

  return router
}
