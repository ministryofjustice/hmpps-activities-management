import { absenceReasonCheckboxMatch, absenceReasonDisplayConverter } from './absenceReasonConverter'
import AttendanceReason from '../../enum/attendanceReason'

describe('Absence Reason Display Converter', () => {
  it('For auto suspended', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.AUTO_SUSPENDED)).toBe('Temporarily absent')
  })

  it('For cancelled', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.CANCELLED)).toBe('Cancelled')
  })

  it('For clash', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.CLASH)).toBe('Clash')
  })

  it('For not required', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.NOT_REQUIRED)).toBe('Not required')
  })

  it('For other', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.OTHER)).toBe('Other')
  })

  it('For refused', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.REFUSED)).toBe('Refused')
  })

  it('For rest', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.REST)).toBe('Rest day')
  })

  it('For sick', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.SICK)).toBe('Sick')
  })

  it('For suspended', async () => {
    expect(absenceReasonDisplayConverter(AttendanceReason.SUSPENDED)).toBe('Suspended')
  })

  it('For no reasons', async () => {
    expect(absenceReasonDisplayConverter(null)).toBe(null)
  })
})

describe('Absence Reason Check Box Match', () => {
  it('For auto suspended', async () => {
    expect(absenceReasonCheckboxMatch(AttendanceReason.AUTO_SUSPENDED, AttendanceReason.CANCELLED)).toBe(false)
  })

  it('For cancelled', async () => {
    expect(absenceReasonCheckboxMatch(AttendanceReason.CANCELLED, AttendanceReason.CANCELLED)).toBe(true)
  })

  it('For not required', async () => {
    expect(
      absenceReasonCheckboxMatch(AttendanceReason.NOT_REQUIRED, [AttendanceReason.CANCELLED, AttendanceReason.CLASH]),
    ).toBe(false)
  })

  it('For clash', async () => {
    expect(
      absenceReasonCheckboxMatch(AttendanceReason.CLASH, [AttendanceReason.CANCELLED, AttendanceReason.CLASH]),
    ).toBe(true)
  })
})
