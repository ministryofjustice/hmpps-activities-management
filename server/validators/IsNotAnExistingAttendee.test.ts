import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import IsNotAnExistingAttendee from './IsNotAnExistingAttendee'
import { AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'

describe('IsNotAnExistingAttendee', () => {
  class DummyForm {
    @Expose()
    @IsNotAnExistingAttendee({ message: 'Prisoner already exists' })
    selectedPrisoner: string
  }

  it('should fail validation if a duplicate prisoner is selected', async () => {
    const body = {
      selectedPrisoner: 'G6123VU',
    }

    const session = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.EDIT,
        prisoners: [
          {
            number: 'G6123VU',
          },
        ],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'selectedPrisoner', error: 'Prisoner already exists' }])
  })

  it('should pass validation if the selected prisoner is not already attending', async () => {
    const body = {
      selectedPrisoner: 'G6123VU',
    }

    const session = {
      appointmentJourney: {
        mode: AppointmentJourneyMode.EDIT,
        prisoners: [
          {
            number: 'QW123TP',
          },
          {
            number: 'PE873NT',
          },
        ],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if no education exists in session', async () => {
    const body = {
      selectedPrisoner: 'G6123VU',
    }

    const session = {
      appointmentJourney: {
        prisoners: [],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
