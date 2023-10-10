import { Expose, plainToInstance } from 'class-transformer'
import { validate, ValidationArguments } from 'class-validator'
import IsValidDatePickerDate from './isValidDatePickerDate'
import { associateErrorsWithProperty } from '../utils/utils'

describe('isValidDatePickerDate', () => {
  class DummyForm {
    @Expose()
    @IsValidDatePickerDate({
      message: (args: ValidationArguments) => {
        return args.value ? 'Enter a valid date' : 'Enter a date'
      },
    })
    date: string
  }

  it.each([{ datePickerDate: undefined }, { datePickerDate: null }, { datePickerDate: '' }])(
    "fails validation with enter a date for '$datePickerDate' date picker date",
    async ({ datePickerDate }) => {
      const body = {
        date: datePickerDate,
      }

      const requestObject = plainToInstance(DummyForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date' }])
    },
  )

  it.each([{ datePickerDate: 'Not a date' }, { datePickerDate: '30/02/2023' }])(
    "fails validation with enter a valid date for '$datePickerDate' date picker date",
    async ({ datePickerDate }) => {
      const body = {
        date: datePickerDate,
      }

      const requestObject = plainToInstance(DummyForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    },
  )

  it('passes validation for valid date picker date', async () => {
    const body = {
      date: '29/09/2023',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
