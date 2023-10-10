import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import { associateErrorsWithProperty } from '../utils/utils'
import DateValidator from './DateValidator'

describe('DateValidator', () => {
  class DummyForm {
    @Expose()
    @DateValidator(thisDate => thisDate >= addDays(startOfToday(), -7), {
      message: 'Enter a date within the last 7 days',
    })
    @DateValidator(thisDate => thisDate <= addDays(startOfToday(), 7), {
      message: 'Enter a date up to 7 days in the future',
    })
    date: Date
  }

  it('should fail validation for a date more than 7 days in the past', async () => {
    const body = {
      date: addDays(new Date(), -8),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter a date within the last 7 days' }])
  })

  it('should fail validation for a date more than 7 days in the future', async () => {
    const body = {
      date: addDays(new Date(), 8),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 7 days in the future' }])
  })

  it('should pass validation for todays date', async () => {
    const body = {
      date: new Date(),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
