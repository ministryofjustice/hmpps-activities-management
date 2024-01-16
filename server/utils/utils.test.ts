import { addDays, format, formatISO, parseISO, subDays } from 'date-fns'
import { enGB } from 'date-fns/locale/en-GB'
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
  convertToNumberArray,
  toTimeItems,
  parseDate,
  toFixed,
  asString,
} from './utils'
import prisoners from './fixtures/prisoners-1.json'
import { Attendance } from '../@types/activitiesAPI/types'

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
      ['First name, last name', false, 'Robert Smith ', 'Smith, Robert'], // Extra space test case for lastName
      ['First name, last name', false, 'Robert  Smith', 'Smith, Robert'], // Extra space test case for firstName
      ['First name, last name', true, 'Robert Smith ', '<strong>Smith</strong>, Robert'], // Extra space added test case for lastName
      ['First name, last name', true, 'Robert  Smith', '<strong>Smith</strong>, Robert'], // Extra space added test case for firstName
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
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T00:00:01.000'), 'H', { locale: enGB }))).toEqual('AM')
    })

    it('returns AM if time is pre 12 noon', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T11:59:59.000'), 'H', { locale: enGB }))).toEqual('AM')
    })

    it('returns PM if time is post 12 noon and before 5PM', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T16:59:59.000'), 'H', { locale: enGB }))).toEqual('PM')
    })

    it('returns ED if time is post 5pm and before midnight', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T23:59:59.000'), 'H', { locale: enGB }))).toEqual('ED')
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
        attendanceCount: 3,
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

  describe('convertToNumberArray', () => {
    it.each([
      ['Undefined', undefined, 0],
      ['Single string value', '1', 1],
      ['Has 2 number elements and NaNs', ['1', '2', 'a', 'b'], 2],
      ['Has 6 number elements and NaNs', ['1', '2', '3', '4', '5', '6', null], 6],
      ['Empty list', [], 0],
    ])('%s convertToNumberArray(%s) has %s elements', (desc: string, maybeArray: string | string[], size: number) => {
      expect(convertToNumberArray(maybeArray)).toHaveLength(size)
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

  describe('asString', () => {
    it.each([
      { test: 'null', value: null, expected: '' },
      { test: 'undefined', value: undefined, expected: '' },
      { test: 'string', value: 'a string', expected: 'a string' },
      { test: 'array', value: ['value 1', 'value 2'], expected: 'value 1' },
      { test: 'object', value: { test: 'test' }, expected: { test: 'test' }.toString() },
    ])('%test asString(%value)', ({ value, expected }) => {
      expect(asString(value)).toEqual(expected)
    })
  })
})
