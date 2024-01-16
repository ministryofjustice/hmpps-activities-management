export default class WaitlistRequester {
  static readonly PRISONER = new WaitlistRequester('PRISONER', 'Self-requested')

  static readonly GUIDANCE_STAFF = new WaitlistRequester(
    'GUIDANCE_STAFF',
    'IAG or careers information, advice and guidance staff',
  )

  static readonly EDUCATION_STAFF = new WaitlistRequester('EDUCATION_STAFF', 'Education staff')

  static readonly WORKSHOP_STAFF = new WaitlistRequester('WORKSHOP_STAFF', 'Workshop staff')

  static readonly ACTIVITY_LEADER = new WaitlistRequester('ACTIVITY_LEADER', 'Activity leader')

  static readonly MENTAL_HEALTH_STAFF = new WaitlistRequester('MENTAL_HEALTH_STAFF', 'Mental health staff')

  static readonly OMU_STAFF = new WaitlistRequester('OMU_STAFF', 'Offender Management Unit')

  static readonly WING_STAFF = new WaitlistRequester('WING_STAFF', 'Wing staff')

  static readonly POM_STAFF = new WaitlistRequester('POM_STAFF', 'Keyworker or POM')

  static readonly RECP_STAFF = new WaitlistRequester('RECP_STAFF', 'Reception staff')

  static readonly RED_BAND = new WaitlistRequester('RED_BAND', 'Orderly or Red Band')

  static readonly OTHER = new WaitlistRequester('OTHER', 'Other')

  static readonly SOMEONE_ELSE = new WaitlistRequester(
    'SOMEONE_ELSE',
    'Someone else, for example a member of staff, an activity leader or an orderly',
  )

  private constructor(
    public readonly code: string,
    public readonly description: string,
  ) {}

  static valueOf(code: string) {
    return Object.values(this).find(w => w.code === code).description
  }

  static codes() {
    return Object.values(this).map(w => w.code)
  }
}
