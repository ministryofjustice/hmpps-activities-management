// eslint-disable-next-line import/no-duplicates
import { addDays, format, formatISO, parseISO, subDays } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import enGBLocale from 'date-fns/locale/en-GB'
import {
  compare,
  comparePrisoners,
  compareStrings,
  convertToTitleCase,
  existsInStringArray,
  getAttendanceSummary,
  getCurrentPeriod,
  initialiseName,
  isAfterToday,
  isTodayOrBefore,
  fullName,
  prisonerName,
  toDate,
  toDateString,
  formatDate,
  toMoney,
  convertToArray,
  toTimeItems,
  exampleDateOneWeekAhead,
  parseDate,
  toFixed,
  getDailyAttendanceSummary,
  getCancelledActivitySummary,
  getSuspendedPrisonerCount,
} from './utils'
import prisoners from './fixtures/prisoners-1.json'
import { AllAttendanceSummary, Attendance } from '../@types/activitiesAPI/types'
import AttendanceReason from '../enum/attendanceReason'
import AttendanceStatus from '../enum/attendanceStatus'
import timeSlot from '../enum/timeSlot'

describe('utils', () => {
  describe('convert to title case', () => {
    it.each([
      [null, null, ''],
      ['empty string', '', ''],
      ['Lower case', 'robert', 'Robert'],
      ['Upper case', 'ROBERT', 'Robert'],
      ['Mixed case', 'RoBErT', 'Robert'],
      ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
      ['Leading spaces', '  RobeRT', '  Robert'],
      ['Trailing spaces', 'RobeRT  ', 'Robert  '],
      ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
    ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
      expect(convertToTitleCase(a)).toEqual(expected)
    })
  })

  describe('initialiseName', () => {
    it.each([
      [null, null, null],
      ['Empty string', '', null],
      ['One word', 'robert', 'r. robert'],
      ['Two words', 'Robert James', 'R. James'],
      ['Three words', 'Robert James Smith', 'R. Smith'],
      ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
    ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
      expect(initialiseName(a)).toEqual(expected)
    })
  })

  describe('fullName', () => {
    it.each([
      [null, null, null],
      ['First name', { firstName: 'Robert', lastName: null }, 'Robert'],
      ['First name, last name', { firstName: 'Robert', lastName: 'Smith' }, 'Robert Smith'],
      [
        'First name, middle names, last name',
        { firstName: 'Robert', middleNames: 'James', lastName: 'Smith' },
        'Robert James Smith',
      ],
    ])('%s fullName(%s, %s)', (_: string, user: Parameters<typeof fullName>[0], expected: string) => {
      expect(fullName(user)).toEqual(expected)
    })
  })

  describe('prisonerName', () => {
    it.each([
      [null, true, null, null],
      ['First name, last name', true, 'Robert Smith', '<strong>Smith</strong>, Robert'],
      ['First name, middle names, last name', true, 'Robert James Smith', '<strong>Smith</strong>, Robert James'],
      [null, false, null, null],
      ['First name, last name', false, 'Robert Smith', 'Smith, Robert'],
      ['First name, middle names, last name', false, 'Robert James Smith', 'Smith, Robert James'],
    ])('%s [bold=%s]', (_: string, bold, inputName, expected: string) => {
      expect(prisonerName(inputName, bold)).toEqual(expected)
    })
  })

  describe('parseDate', () => {
    it.each([
      ['2022-02-17', undefined, new Date(2022, 1, 17)],
      ['17/02/2022', 'dd/MM/yyyy', new Date(2022, 1, 17)],
    ])('%s parseDate(%s, %s)', (date: string, fmt: string, expected: Date) => {
      expect(parseDate(date, fmt)).toEqual(expected)
    })
  })

  describe('getCurrentPeriod', () => {
    it('returns AM if time is post midnight', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T00:00:01.000'), 'H', { locale: enGBLocale }))).toEqual('AM')
    })

    it('returns AM if time is pre 12 noon', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T11:59:59.000'), 'H', { locale: enGBLocale }))).toEqual('AM')
    })

    it('returns PM if time is post 12 noon and before 5PM', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T16:59:59.000'), 'H', { locale: enGBLocale }))).toEqual('PM')
    })

    it('returns ED if time is post 5pm and before midnight', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T23:59:59.000'), 'H', { locale: enGBLocale }))).toEqual('ED')
    })
  })

  describe('comparePrisoners by name', () => {
    it('sort by name asc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(comparePrisoners('name', false))
      expect(results[0].lastName).toEqual('CHOLAK')
    })
    it('sort by name desc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(comparePrisoners('name', true))
      expect(results[0].lastName).toEqual('SMITH')
    })
  })

  describe('comparePrisoners by prisonerNumber', () => {
    it('sort by name asc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(comparePrisoners('prisonNumber', false))
      expect(results[0].lastName).toEqual('CHOLAK')
    })
    it('sort by name desc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(comparePrisoners('prisonNumber', true))
      expect(results[0].lastName).toEqual('SMITH')
    })
  })

  describe('comparePrisoners by location', () => {
    it('sort by name asc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(comparePrisoners('location', false))
      expect(results[0].lastName).toEqual('CHOLAK')
    })
    it('sort by name desc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(comparePrisoners('location', true))
      expect(results[0].lastName).toEqual('SMITH')
    })
  })

  describe('compare', () => {
    it('sort by name asc', () => {
      const results = prisoners.sort(compare('lastName', false, undefined))
      expect(results[0].lastName).toEqual('CHOLAK')
    })
    it('sort by name desc', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const results = prisoners.sort(compare('lastName', true, undefined))
      expect(results[0].lastName).toEqual('SMITH')
    })
  })

  describe('compareStrings', () => {
    it('sort by name asc', () => {
      const results = ['shaz', 'Baz'].sort(compareStrings)
      expect(results[0]).toEqual('Baz')
    })
  })

  describe('toDateString', () => {
    it('converts a date to a string', () => {
      expect(toDateString(new Date(2022, 10, 20))).toEqual('2022-11-20')
    })
  })

  describe('formatDate', () => {
    it('formats a date to a long date with day', () => {
      expect(formatDate(new Date(2022, 0, 1), 'cccc do LLLL y')).toEqual('Saturday 1st January 2022')
    })

    it('formats a date to a long date with day when inContext not available', () => {
      expect(formatDate(new Date(2022, 0, 1), 'cccc do LLLL y', true)).toEqual('Saturday 1st January 2022')
    })

    it('formats todays date as "today"', () => {
      expect(formatDate(new Date(), '', true)).toEqual('today')
    })

    it('formats yesterdays date as "yesterday"', () => {
      expect(formatDate(subDays(new Date(), 1), '', true)).toEqual('yesterday')
    })

    it('formats tomorrows date as "tomorrow"', () => {
      expect(formatDate(addDays(new Date(), 1), '', true)).toEqual('tomorrow')
    })

    it('formats a date in string format', () => {
      expect(formatDate('2022-01-01', 'cccc do LLLL y')).toEqual('Saturday 1st January 2022')
    })
  })

  describe('toDate', () => {
    it('converts a string to a date', () => {
      expect(toDate('2022-12-02')).toEqual(new Date(2022, 11, 2))
    })
  })

  describe('existsInStringArray', () => {
    it.each([
      ['Exists', 'a', ['a', 'b', 'c'], true],
      ['Does not exist', 'd', ['a', 'b', 'c'], false],
      ['Exists several times', 'a', ['a', 'a', 'a'], true],
      ['Empty list', 'a', [], false],
    ])('%s existsInStringArray(%s, %s) == %s', (desc: string, key: string, list: string[], expected: boolean) => {
      expect(existsInStringArray(key, list)).toEqual(expected)
    })
  })

  describe('isAfterToday', () => {
    it.each([
      ['Is tomorrow', formatISO(addDays(new Date(), 1), { representation: 'date' }), true],
      ['Is today', formatISO(new Date(), { representation: 'date' }), false],
      ['Is yesterday', formatISO(addDays(new Date(), -1), { representation: 'date' }), false],
      ['Is a week ago', formatISO(addDays(new Date(), -7), { representation: 'date' }), false],
      ['Is next week', formatISO(addDays(new Date(), 7), { representation: 'date' }), true],
    ])('%s isAfterToday(%s) == %s', (desc: string, dateString: string, expected: boolean) => {
      expect(isAfterToday(dateString)).toEqual(expected)
    })
  })

  describe('isTodayOrBefore', () => {
    it.each([
      ['Is yesterday', formatISO(addDays(new Date(), -1), { representation: 'date' }), true],
      ['Is today', formatISO(new Date(), { representation: 'date' }), true],
      ['Is a week ago', formatISO(addDays(new Date(), -7), { representation: 'date' }), true],
      ['Is tomorrow', formatISO(addDays(new Date(), 1), { representation: 'date' }), false],
      ['Is next week', formatISO(addDays(new Date(), 7), { representation: 'date' }), false],
    ])('%s isTodayOrBefore(%s) == %s', (desc: string, dateString: string, expected: boolean) => {
      expect(isTodayOrBefore(dateString)).toEqual(expected)
    })
  })

  describe('getAttendanceSummary', () => {
    it('calculates the attendance summary', () => {
      const attendance = [
        { status: 'WAITING' },
        { status: 'COMPLETED', attendanceReason: { code: 'ATTENDED' } },
        { status: 'COMPLETED', attendanceReason: { code: 'SICK' } },
      ] as Attendance[]

      expect(getAttendanceSummary(attendance)).toEqual({
        allocated: 3,
        attended: 1,
        attendedPercentage: '33',
        notAttended: 1,
        notAttendedPercentage: '33',
        notRecorded: 1,
        notRecordedPercentage: '33',
      })
    })
  })

  describe('toMoney', () => {
    it('should convert pence to pounds at 2 decimal places', () => {
      expect(toMoney(150)).toEqual('£1.50')
      expect(toMoney(15000)).toEqual('£150.00')
      expect(toMoney(15.53)).toEqual('£0.16')
    })
  })

  describe('convertToArray', () => {
    it.each([
      ['Undefined', undefined, 0],
      ['Single string value', 'a string', 1],
      ['Has 3 elements', ['a', 'a', 'a'], 3],
      ['Empty list', [], 0],
    ])('%s convertToArray(%s) has %s elements', (desc: string, maybeArray: string | string[], size: number) => {
      expect(convertToArray(maybeArray)).toHaveLength(size)
    })
  })

  describe('toTimeItems', () => {
    it('should add default -- option', () => {
      expect(toTimeItems(['00'], undefined)).toEqual([
        {
          value: '-',
          text: '--',
          selected: false,
        },
        {
          value: '0',
          text: '00',
          selected: false,
        },
      ])
    })

    it('should select selected', () => {
      expect(toTimeItems(['00', '05', '10'], 10)).toEqual([
        {
          value: '-',
          text: '--',
          selected: false,
        },
        {
          value: '0',
          text: '00',
          selected: false,
        },
        {
          value: '5',
          text: '05',
          selected: false,
        },
        {
          value: '10',
          text: '10',
          selected: true,
        },
      ])
    })

    it('should select selected even when select is 0', () => {
      expect(toTimeItems(['00', '05', '10'], 0)).toEqual([
        {
          value: '-',
          text: '--',
          selected: false,
        },
        {
          value: '0',
          text: '00',
          selected: true,
        },
        {
          value: '5',
          text: '05',
          selected: false,
        },
        {
          value: '10',
          text: '10',
          selected: false,
        },
      ])
    })
  })

  describe('exampleDateOneWeekAhead', () => {
    it('should return the date one week from now in dd MM yyyy format', () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      expect(exampleDateOneWeekAhead('Example, ')).toEqual(`Example, ${formatDate(nextWeek, 'dd MM yyyy')}`)
    })
  })

  describe('toFixed', () => {
    it('should convert number to fixed-point formatted string', () => {
      const number = 1234.5
      const fixedPointString = toFixed(number, 2)
      expect(fixedPointString).toEqual('1234.50')
    })

    it('should return 0 if number not provided', () => {
      const number: number = null
      const fixedPointString = toFixed(number, 2)
      expect(fixedPointString).toEqual(null)
    })
  })

  describe('getDailyAttendanceSummary', () => {
    it('calculates the daily attendance summary', () => {
      const dailyAttendance = [
        {
          id: 1,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.WAITING,
          attendanceReasonCode: null,
          issuePayment: null,
          attendanceCount: 3,
        },
        {
          id: 2,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'ED',
          status: AttendanceStatus.WAITING,
          attendanceReasonCode: null,
          issuePayment: null,
          attendanceCount: 1,
        },
        {
          id: 3,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'ED',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.ATTENDED,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 4,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.CANCELLED,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 5,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.SICK,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 6,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.NOT_REQUIRED,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 7,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.REST,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 8,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.CLASH,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 9,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.OTHER,
          issuePayment: true,
          attendanceCount: 1,
        },
        {
          id: 10,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.SICK,
          issuePayment: false,
          attendanceCount: 1,
        },
        {
          id: 11,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.REFUSED,
          issuePayment: false,
          attendanceCount: 1,
        },
        {
          id: 12,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.REST,
          issuePayment: false,
          attendanceCount: 1,
        },
        {
          id: 13,
          prisonCode: 'MDI',
          activityId: 1,
          categoryName: 'Education',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.OTHER,
          issuePayment: false,
          attendanceCount: 1,
        },
      ] as AllAttendanceSummary[]

      expect(getDailyAttendanceSummary(dailyAttendance)).toEqual({
        totalAbsences: {
          AM: 10,
          DAY: 10,
          ED: 0,
          PM: 0,
        },
        totalAbsencesPercentage: {
          AM: 76.9,
          DAY: 66.7,
          ED: 0,
          PM: 0,
        },
        totalActivities: {
          AM: 1,
          DAY: 1,
          ED: 1,
          PM: 0,
        },
        totalAllocated: {
          AM: 13,
          DAY: 15,
          ED: 2,
          PM: 0,
        },
        totalAttended: {
          AM: 0,
          DAY: 1,
          ED: 1,
          PM: 0,
        },
        totalAttendedPercentage: {
          AM: 0,
          DAY: 6.7,
          ED: 50,
          PM: 0,
        },
        totalCancelled: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalClash: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalNotAttended: {
          AM: 3,
          DAY: 4,
          ED: 1,
          PM: 0,
        },
        totalNotAttendedPercentage: {
          AM: 23.1,
          DAY: 26.7,
          ED: 50,
          PM: 0,
        },
        totalNotRequired: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalPaidAbsences: {
          AM: 6,
          DAY: 6,
          ED: 0,
          PM: 0,
        },
        totalPaidOther: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalPaidRest: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalPaidSick: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalRefused: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalUnPaidAbsences: {
          AM: 4,
          DAY: 4,
          ED: 0,
          PM: 0,
        },
        totalUnpaidOther: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalUnpaidRest: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalUnpaidSick: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
      })
    })
  })

  describe('getCancelledActivitySummary', () => {
    it('calculates the cancelled session summary', () => {
      const cancelledAttendance = [
        {
          id: 1,
          timeSlot: timeSlot.AM,
          cancelled: true,
          category: 'Education',
          cancelledReason: 'Staff unavailable',
        },
        {
          id: 2,
          timeSlot: timeSlot.AM,
          cancelled: true,
          category: 'Education',
          cancelledReason: 'Staff training',
        },
        {
          id: 3,
          timeSlot: timeSlot.AM,
          cancelled: true,
          category: 'Education',
          cancelledReason: 'Session not required',
        },
        {
          id: 4,
          timeSlot: timeSlot.PM,
          cancelled: true,
          category: 'Education',
          cancelledReason: 'Location unavailable',
        },
        {
          id: 3,
          timeSlot: timeSlot.ED,
          cancelled: true,
          category: 'Education',
          cancelledReason: 'Prison operational issue',
        },
      ]

      expect(getCancelledActivitySummary(cancelledAttendance)).toEqual({
        totalCancelled: {
          AM: 3,
          DAY: 5,
          ED: 1,
          PM: 1,
        },
        totalStaffUnavailable: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalStaffTraining: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalNotRequired: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
        totalLocationUnavailable: {
          AM: 0,
          DAY: 1,
          ED: 0,
          PM: 1,
        },
        totalOperationalIssue: {
          AM: 0,
          DAY: 1,
          ED: 1,
          PM: 0,
        },
      })
    })
  })

  describe('getSuspendedPrisonerCount', () => {
    it('calculates the no of suspended prisoners', () => {
      const suspendedAttendance = [
        {
          attendanceId: 1,
          prisonCode: 'MDI',
          sessionDate: '2022-10-10',
          timeSlot: 'AM',
          status: AttendanceStatus.COMPLETED,
          attendanceReasonCode: AttendanceReason.SUSPENDED,
          issuePayment: false,
          prisonerNumber: 'A12345A',
        },
      ]

      expect(getSuspendedPrisonerCount(suspendedAttendance)).toEqual({
        suspendedPrisonerCount: {
          AM: 1,
          DAY: 1,
          ED: 0,
          PM: 0,
        },
      })
    })
  })
})
