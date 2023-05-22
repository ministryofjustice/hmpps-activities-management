import { promises as fsPromises } from 'fs'
import PrisonerListCsvParser from './prisonerListCsvParser'
import { FormValidationError } from '../middleware/formValidationErrorHandler'

jest.spyOn(fsPromises, 'unlink').mockImplementation(path => {
  if (path === 'server/utils/fixtures/not-found.csv') return Promise.reject()
  return Promise.resolve()
})

const parser = new PrisonerListCsvParser()

describe('readCsvValues', () => {
  it('should throw validation error when file not found', async () => {
    let exception
    try {
      await parser.readCsvValues({ path: 'server/utils/fixtures/not-found.csv' } as unknown as Express.Multer.File)
    } catch (e) {
      exception = e
    }

    expect(exception).toBeInstanceOf(FormValidationError)
    expect((exception as FormValidationError).field).toEqual('file')
    expect((exception as FormValidationError).message).toEqual('The selected file could not be uploaded – try again')
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should throw validation error when file is not CSV', async () => {
    let exception
    try {
      await parser.readCsvValues({
        path: 'server/utils/fixtures/non-csv-file.xlsx',
      } as unknown as Express.Multer.File)
    } catch (e) {
      exception = e
    }

    expect(exception).toBeInstanceOf(FormValidationError)
    expect((exception as FormValidationError).field).toEqual('file')
    expect((exception as FormValidationError).message).toEqual('The selected file must use the CSV template')
    expect(fsPromises.unlink).toHaveBeenCalled()
  })
})

describe('getPrisonNumbers', () => {
  it('should return no prison numbers when file is empty', async () => {
    const prisonerNumbers = await parser.getPrisonNumbers({
      path: 'server/utils/fixtures/empty-upload-prisoner-list.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers.length).toBe(0)
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return prison numbers without header row', async () => {
    const prisonerNumbers = await parser.getPrisonNumbers({
      path: 'server/utils/fixtures/upload-prisoner-list.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers).toEqual(['A1234BC', 'B2345CD'])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return prison numbers when header row not included', async () => {
    const prisonerNumbers = await parser.getPrisonNumbers({
      path: 'server/utils/fixtures/upload-prisoner-list-no-header.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers).toEqual(['A1234BC', 'B2345CD'])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return unique prison numbers', async () => {
    const prisonerNumbers = await parser.getPrisonNumbers({
      path: 'server/utils/fixtures/upload-prisoner-list-duplicates.csv',
    } as unknown as Express.Multer.File)

    expect(prisonerNumbers).toEqual(['A1234BC', 'B2345CD'])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })
})

describe('getAppointments', () => {
  it('should return appointments when file is empty', async () => {
    const appointments = await parser.getAppointments({
      path: 'server/utils/fixtures/bulk-appointment/empty-bulk-appointment.csv',
    } as unknown as Express.Multer.File)

    expect(appointments.length).toBe(0)
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return appointments without header row', async () => {
    const appointments = await parser.getAppointments({
      path: 'server/utils/fixtures/bulk-appointment/bulk-appointment.csv',
    } as unknown as Express.Multer.File)

    expect(appointments).toEqual([
      {
        prisonerNumber: 'A1234BC',
        startTime: {
          hour: 10,
          minute: 0,
        },
        endTime: {
          hour: 11,
          minute: 0,
        },
      },
      {
        prisonerNumber: 'B2345CD',
        startTime: {
          hour: 13,
          minute: 30,
        },
        endTime: {
          hour: 14,
          minute: 0,
        },
      },
    ])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return appointments when header row not included', async () => {
    const appointments = await parser.getAppointments({
      path: 'server/utils/fixtures/bulk-appointment/bulk-appointment-no-header.csv',
    } as unknown as Express.Multer.File)

    expect(appointments).toEqual([
      {
        prisonerNumber: 'A1234BC',
        startTime: {
          hour: 10,
          minute: 0,
        },
        endTime: {
          hour: 11,
          minute: 0,
        },
      },
      {
        prisonerNumber: 'B2345CD',
        startTime: {
          hour: 13,
          minute: 30,
        },
        endTime: {
          hour: 14,
          minute: 0,
        },
      },
    ])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })

  it('should return unique appointments', async () => {
    const appointments = await parser.getAppointments({
      path: 'server/utils/fixtures/bulk-appointment/bulk-appointment-duplicates.csv',
    } as unknown as Express.Multer.File)

    expect(appointments).toEqual([
      {
        prisonerNumber: 'A1234BC',
        startTime: {
          hour: 10,
          minute: 0,
        },
        endTime: {
          hour: 11,
          minute: 0,
        },
      },
      {
        prisonerNumber: 'B2345CD',
        startTime: {
          hour: 13,
          minute: 30,
        },
        endTime: {
          hour: 14,
          minute: 0,
        },
      },
    ])
    expect(fsPromises.unlink).toHaveBeenCalled()
  })
})
