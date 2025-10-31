import WaitlistRequester from '../../enum/waitlistRequester'

export default function waitlistRequesterConverter(requester: string, prisonerName: string) {
  switch (requester) {
    case WaitlistRequester.ACTIVITY_LEADER.code:
      return 'Activity leader'
    case WaitlistRequester.EDUCATION_STAFF.code:
      return 'Education staff'
    case WaitlistRequester.GUIDANCE_STAFF.code:
      return 'IAG or careers information, advice and guidance staff'
    case WaitlistRequester.MENTAL_HEALTH_STAFF.code:
      return 'Mental health staff'
    case WaitlistRequester.OMU_STAFF.code:
      return 'Offender Management Unit'
    case WaitlistRequester.OTHER.code:
      return 'Other'
    case WaitlistRequester.POM_STAFF.code:
      return 'Keyworker or POM'
    case WaitlistRequester.PRISONER.code:
      return prisonerName
    case WaitlistRequester.RECP_STAFF.code:
      return 'Reception staff'
    case WaitlistRequester.RED_BAND.code:
      return 'Orderly or Red Band'
    case WaitlistRequester.SOMEONE_ELSE.code:
      return 'Someone else, for example a member of staff, an activity leader or an orderly'
    case WaitlistRequester.WING_STAFF.code:
      return 'Wing staff'
    case WaitlistRequester.WORKSHOP_STAFF.code:
      return 'Workshop staff'
    default:
      return null
  }
}
