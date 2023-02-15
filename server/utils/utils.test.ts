// eslint-disable-next-line import/no-duplicates
import { addDays, format, parseISO, subDays } from 'date-fns'
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
  toDate,
  toDateString,
  formatDate,
  toMoney,
  toTimeItems,
  toPrisonerDescription,
  toPrisonerSummary,
  exampleDateOneWeekAhead,
} from './utils'
import prisoners from './fixtures/prisoners-1.json'
import { Attendance } from '../@types/activitiesAPI/types'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'

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

  describe('initialise name', () => {
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

  describe('getAttendanceSummary', () => {
    it('calculates the attendance summary', () => {
      const attendance = [
        { status: 'SCHEDULED' },
        { status: 'COMPLETED', attendanceReason: { code: 'ATT' } },
        { status: 'COMPLETED', attendanceReason: { code: 'ABS' } },
      ] as Attendance[]

      expect(getAttendanceSummary(attendance)).toEqual({
        allocated: 3,
        attended: 1,
        notAttended: 1,
        notRecorded: 1,
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

  describe('toPrisonerDescription', () => {
    it('should return name, number and cell location separated by pipe characters', () => {
      const prisoner = {
        prisonerNumber: 'A1234BC',
        firstName: 'Test',
        lastName: 'Prisoner',
        cellLocation: '1-1-1',
      } as Prisoner
      expect(toPrisonerDescription(prisoner)).toEqual('Test Prisoner | A1234BC | 1-1-1')
    })
  })

  describe('toPrisonerSummary', () => {
    it('should return name, number and cell location separated by line breaks', () => {
      const prisoner = {
        prisonerNumber: 'A1234BC',
        firstName: 'Test',
        lastName: 'Prisoner',
        cellLocation: '1-1-1',
      } as Prisoner
      expect(toPrisonerSummary(prisoner)).toEqual('Test Prisoner<br/>A1234BC<br/>1-1-1')
    })
  })

  describe('exampleDateOneWeekAhead', () => {
    it('should return the date one week from now in dd MM yyyy format', () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      expect(exampleDateOneWeekAhead('Example, ')).toEqual(`Example, ${formatDate(nextWeek, 'dd MM yyyy')}`)
    })
  })
})
