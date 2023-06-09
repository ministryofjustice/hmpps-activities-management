import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import EducationNotDuplicated from './educationNotDuplicated'

describe('educationLevelNotDuplicated', () => {
  class DummyForm {
    @Expose()
    studyAreaCode: string

    @Expose()
    @EducationNotDuplicated({ message: 'Education already exists' })
    eduLevelCode: string
  }

  it('should fail validation if a duplicate education is selected', async () => {
    const body = {
      studyAreaCode: 'ENGLA',
      eduLevelCode: '1',
    }

    const session = {
      createJourney: {
        educationLevels: [
          {
            studyAreaCode: 'ENGLA',
            studyAreaDescription: 'English Language',
            educationLevelCode: '1',
            educationLevelDescription: 'xxx',
          },
        ],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'eduLevelCode', error: 'Education already exists' }])
  })

  it('should pass validation if education level exists for a different study area', async () => {
    const body = {
      studyAreaCode: 'MAT',
      eduLevelCode: 'CERT001',
    }

    const session = {
      createJourney: {
        educationLevels: [
          {
            studyAreaCode: 'ENGLA',
            studyAreaDescription: 'English Language',
            educationLevelCode: 'CERT001',
            educationLevelDescription: 'Certificate Level 1',
          },
        ],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if study area exists for a different education level', async () => {
    const body = {
      studyAreaCode: 'ENGLA',
      eduLevelCode: 'CERT002',
    }

    const session = {
      createJourney: {
        educationLevels: [
          {
            studyAreaCode: 'ENGLA',
            studyAreaDescription: 'English Language',
            educationLevelCode: 'CERT001',
            educationLevelDescription: 'Certificate Level 1',
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
      studyAreaCode: 'ENGLA',
      eduLevelCode: '1',
    }

    const session = {
      createJourney: {},
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
