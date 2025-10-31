import WaitlistRequester from '../../enum/waitlistRequester'
import waitlistRequesterConverter from './waitlistRequesterConverter'

const prisonerName = 'Joe Bloggs'

describe('waitlist requester Display Converter', () => {
  it('For Activity leader', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.ACTIVITY_LEADER.code, prisonerName)).toBe('Activity leader')
  })

  it('For Education staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.EDUCATION_STAFF.code, prisonerName)).toBe('Education staff')
  })

  it('Guidance staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.GUIDANCE_STAFF.code, prisonerName)).toBe(
      'IAG or careers information, advice and guidance staff',
    )
  })

  it('Mental health staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.MENTAL_HEALTH_STAFF.code, prisonerName)).toBe(
      'Mental health staff',
    )
  })

  it('For OMU staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.OMU_STAFF.code, prisonerName)).toBe('Offender Management Unit')
  })

  it('For other', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.OTHER.code, prisonerName)).toBe('Other')
  })

  it('For Keyworker/POM', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.POM_STAFF.code, prisonerName)).toBe('Keyworker or POM')
  })

  it('For prisoner', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.PRISONER.code, prisonerName)).toBe('Joe Bloggs')
  })

  it('For reception staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.RECP_STAFF.code, prisonerName)).toBe('Reception staff')
  })

  it('For orderly', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.RED_BAND.code, prisonerName)).toBe('Orderly or Red Band')
  })

  it('For someone else', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.SOMEONE_ELSE.code, prisonerName)).toBe(
      'Someone else, for example a member of staff, an activity leader or an orderly',
    )
  })

  it('For wing staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.WING_STAFF.code, prisonerName)).toBe('Wing staff')
  })

  it('For workshop staff', async () => {
    expect(waitlistRequesterConverter(WaitlistRequester.WORKSHOP_STAFF.code, prisonerName)).toBe('Workshop staff')
  })

  it('For no reasons', async () => {
    expect(waitlistRequesterConverter(null, null)).toBe(null)
  })
})
