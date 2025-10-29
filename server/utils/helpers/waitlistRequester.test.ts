import WaitlistRequester from '../../enum/waitlistRequester'
import requesterReasonDisplayConverter from './waitlistRequesterConverter'

const prisonerName = 'Joe Bloggs'

describe('waitlist requester Display Converter', () => {
  it('For Activity leader', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.ACTIVITY_LEADER.code, prisonerName)).toBe(
      'Activity leader',
    )
  })

  it('For Education staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.EDUCATION_STAFF.code, prisonerName)).toBe(
      'Education staff',
    )
  })

  it('Guidance staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.GUIDANCE_STAFF.code, prisonerName)).toBe(
      'IAG or careers information, advice and guidance staff',
    )
  })

  it('Mental health staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.MENTAL_HEALTH_STAFF.code, prisonerName)).toBe(
      'Mental health staff',
    )
  })

  it('For OMU staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.OMU_STAFF.code, prisonerName)).toBe(
      'Offender Management Unit',
    )
  })

  it('For other', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.OTHER.code, prisonerName)).toBe('Other')
  })

  it('For Keyworker/POM', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.POM_STAFF.code, prisonerName)).toBe('Keyworker or POM')
  })

  it('For prisoner', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.PRISONER.code, prisonerName)).toBe('Joe Bloggs')
  })

  it('For reception staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.RECP_STAFF.code, prisonerName)).toBe('Reception staff')
  })

  it('For orderly', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.RED_BAND.code, prisonerName)).toBe('Orderly or Red Band')
  })

  it('For someone else', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.SOMEONE_ELSE.code, prisonerName)).toBe(
      'Someone else, for example a member of staff, an activity leader or an orderly',
    )
  })

  it('For wing staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.WING_STAFF.code, prisonerName)).toBe('Wing staff')
  })

  it('For workshop staff', async () => {
    expect(requesterReasonDisplayConverter(WaitlistRequester.WORKSHOP_STAFF.code, prisonerName)).toBe('Workshop staff')
  })

  it('For no reasons', async () => {
    expect(requesterReasonDisplayConverter(null, null)).toBe(null)
  })
})
