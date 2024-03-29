import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import _ from 'lodash'
import { parse } from 'date-fns'
import SimpleTime, { simpleTimeFromDate } from './simpleTime'
import { associateErrorsWithProperty } from '../utils/utils'

describe('simpleTime', () => {
  describe('validation', () => {
    it('validation fails for undefined', async () => {
      const body = {}

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(_.uniqBy(errors, 'property')).toEqual([
        { property: 'hour', error: 'Select an hour' },
        { property: 'minute', error: 'Select a minute' },
      ])
    })

    it('validation fails for non numerical strings', async () => {
      const body = {
        hour: 'nine',
        minute: 'thirty',
      }

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(_.uniqBy(errors, 'property')).toEqual([
        { property: 'hour', error: 'Select an hour' },
        { property: 'minute', error: 'Select a minute' },
      ])
    })

    it('validation fails for minimum out of bounds', async () => {
      const body = {
        hour: -1,
        minute: -1,
      }

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'hour', error: 'Select an hour' },
        { property: 'minute', error: 'Select a minute' },
      ])
    })

    it('validation fails for maximum out of bounds', async () => {
      const body = {
        hour: 24,
        minute: 60,
      }

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'hour', error: 'Select an hour' },
        { property: 'minute', error: 'Select a minute' },
      ])
    })

    it('validation fails for decimals', async () => {
      const body = {
        hour: 9.1,
        minute: 30.1,
      }

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'hour', error: 'Select an hour' },
        { property: 'minute', error: 'Select a minute' },
      ])
    })

    it('validation succeeds for numerical strings', async () => {
      const body = {
        hour: '9',
        minute: '30',
      }

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation succeeds for integers', async () => {
      const body = {
        hour: 14,
        minute: 55,
      }

      const requestObject = plainToInstance(SimpleTime, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })

  describe('toDate', () => {
    it("should convert to today's date with supplied time if no base date is specified", () => {
      const body = {
        hour: 9,
        minute: 30,
      }
      const expectedDate = new Date()
      expectedDate.setHours(9, 30, 0, 0)

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toDate()).toEqual(expectedDate)
    })

    it("should use base date's date with supplied time", () => {
      const body = {
        hour: 9,
        minute: 30,
      }
      const baseDate = new Date('2023-05-06T01:02:03')

      const expectedDate = new Date('2023-05-06')
      expectedDate.setHours(9, 30, 0, 0)

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toDate(baseDate)).toEqual(expectedDate)
    })
  })

  describe('toString', () => {
    it('should convert to string', async () => {
      const body = {
        hour: 12,
        minute: 25,
      }

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toString()).toEqual('12:25')
    })

    it('should not pad time components', async () => {
      const body = {
        hour: 8,
        minute: 5,
      }

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toString()).toEqual('8:5')
    })

    it('should use 24 hour clock', async () => {
      const body = {
        hour: 14,
        minute: 55,
      }

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toString()).toEqual('14:55')
    })
  })

  describe('toIsoString', () => {
    it('should convert to iso string', async () => {
      const body = {
        hour: 12,
        minute: 25,
      }

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toIsoString()).toEqual('12:25')
    })

    it('should pad time components', async () => {
      const body = {
        hour: 8,
        minute: 5,
      }

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toIsoString()).toEqual('08:05')
    })

    it('should use 24 hour clock', async () => {
      const body = {
        hour: 14,
        minute: 55,
      }

      const requestObject = plainToInstance(SimpleTime, body)

      expect(requestObject.toIsoString()).toEqual('14:55')
    })
  })

  describe('simpleTimeFromTime', () => {
    it('should convert from valid date', async () => {
      const date = parse(`2023-03-01T14:30`, "yyyy-MM-dd'T'HH:mm", new Date())

      const simpleTime = simpleTimeFromDate(date)

      expect(simpleTime.hour).toEqual(14)
      expect(simpleTime.minute).toEqual(30)
    })

    it('should return null when passed an undefined date', async () => {
      const simpleTime = simpleTimeFromDate(undefined)

      expect(simpleTime).toBeNull()
    })

    it('should return null when passed a null date', async () => {
      const simpleTime = simpleTimeFromDate(null)

      expect(simpleTime).toBeNull()
    })

    it('should return null when passed an invalid date', async () => {
      const date = parse(`2023-03-01T14:61`, "yyyy-MM-dd'T'HH:mm", new Date())

      const simpleTime = simpleTimeFromDate(date)

      expect(simpleTime).toBeNull()
    })
  })
})
