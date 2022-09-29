// eslint-disable-next-line import/no-duplicates
import { format, parseISO } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import enGBLocale from 'date-fns/locale/en-GB'
import { convertToTitleCase, getCurrentPeriod, initialiseName } from './utils'

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
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T00:00:01.000'), 'H', { locale: enGBLocale })) === 'AM')
    })

    it('returns AM if time is pre 12 noon', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T11:59:59.000'), 'H', { locale: enGBLocale })) === 'AM')
    })

    it('returns PM if time is post 12 noon and before 5PM', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T16:59:59.000'), 'H', { locale: enGBLocale })) === 'PM')
    })

    it('returns ED if time is post 5pm and before midnight', () => {
      expect(getCurrentPeriod(+format(parseISO('2019-08-11T23:59:59.000'), 'H', { locale: enGBLocale })) === 'ED')
    })
  })

  // describe('mapToQueryParams', () => {
  //   it('should handle empty maps', () => {
  //     expect(mapToQueryString({})).toEqual('')
  //   })
  //
  //   it('should handle single key values', () => {
  //     expect(mapToQueryString({ key1: 'val' })).toEqual('key1=val')
  //   })
  //
  //   it('should handle non-string, scalar values', () => {
  //     expect(mapToQueryString({ key1: 1, key2: true })).toEqual('key1=1&key2=true')
  //   })
  //
  //   it('should ignore null values', () => {
  //     expect(mapToQueryString({ key1: 1, key2: null })).toEqual('key1=1')
  //   })
  //
  //   it('should handle encode values', () => {
  //     expect(mapToQueryString({ key1: "Hi, I'm here" })).toEqual("key1=Hi%2C%20I'm%20here")
  //   })
  // })
})
