import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { parse } from 'date-fns'
import SimpleDate from './simpleDate'
import { associateErrorsWithProperty } from '../utils/utils'

describe('simpleDate', () => {
  describe('transformation and validation', () => {
    it('validation fails for decimals', async () => {
      const body = {
        day: 1.1,
        month: 2.2,
        year: 2022.1,
      }

      const requestObject = plainToInstance(SimpleDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'day', error: 'Enter a valid day' },
        { property: 'month', error: 'Enter a valid month' },
        { property: 'year', error: 'Enter a valid year' },
      ])
    })

    it('validation fails if number is not entered', async () => {
      const body = {
        day: '',
        month: '',
        year: '',
      }

      const requestObject = plainToInstance(SimpleDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'day', error: 'Enter a valid day' },
        { property: 'month', error: 'Enter a valid month' },
        { property: 'year', error: 'Enter a valid year' },
      ])
    })

    it('validation fails if fields entered are out of range', async () => {
      const body = {
        day: 32,
        month: 13,
        year: 22,
      }

      const requestObject = plainToInstance(SimpleDate, body, { excludeExtraneousValues: true })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'day', error: 'Enter a valid day' },
        { property: 'month', error: 'Enter a valid month' },
        { property: 'year', error: 'Year must be entered in the format YYYY' },
      ])
    })

    it('accepts valid strings', async () => {
      const body = {
        day: '30',
        month: '12',
        year: '2022',
      }

      const requestObject = plainToInstance(SimpleDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })

  describe('toRichDate', () => {
    it('should convert to a date', () => {
      const body = {
        day: '30',
        month: '12',
        year: '2022',
      }

      const requestObject = plainToInstance(SimpleDate, body)
      expect(requestObject.toRichDate()).toEqual(parse(`2022-12-30`, 'yyyy-MM-dd', new Date()))
    })
  })

  describe('toString', () => {
    it('converts to string', async () => {
      const body = {
        day: '30',
        month: '12',
        year: '2022',
      }

      const requestObject = plainToInstance(SimpleDate, body)
      expect(requestObject.toString()).toEqual('2022-12-30')
    })
  })
})
