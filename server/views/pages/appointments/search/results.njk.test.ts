import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import TimeSlot from '../../../../enum/timeSlot'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import { AppointmentType } from '../../../../routes/appointments/create-and-edit/appointmentJourney'
import { toDateString } from '../../../../utils/utils'

const view = fs.readFileSync('server/views/pages/appointments/search/results.njk')

describe('Views - Appointments Management - Appointment Search Results', () => {
  let compiledTemplate: Template
  let viewContext = {
    user: {
      username: '',
    },
    startDate: simpleDateFromDate(new Date()),
    timeSlot: TimeSlot.AM,
    categories: [{}],
    categoryCode: '',
    locations: [{}],
    locationId: 1,
    prisonerNumber: '',
    createdBy: '',
    type: AppointmentType.INDIVIDUAL,
    results: [{}],
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      user: {
        username: 'test.user',
      },
      startDate: simpleDateFromDate(new Date()),
      timeSlot: TimeSlot.AM,
      categories: [
        {
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        {
          code: 'MEDO',
          description: 'Medical - Doctor',
        },
        {
          code: 'GYMW',
          description: 'Gym - Weights',
        },
      ],
      categoryCode: 'MEDO',
      locations: [
        {
          id: 26152,
          description: 'Chapel',
        },
        {
          id: 26149,
          description: 'Gym',
        },
        {
          id: 26151,
          description: 'Library',
        },
      ],
      locationId: 26151,
      prisonerNumber: 'A1234BC',
      createdBy: 'all',
      type: AppointmentType.INDIVIDUAL,
      results: [
        {
          appointmentId: 1,
          appointmentOccurrenceId: 2,
          appointmentType: 'INDIVIDUAL',
          allocations: [{}],
          category: {
            code: 'TEST1',
            description: 'Test Category 1',
          },
          internalLocation: {
            description: 'Test Location 1',
          },
          startDate: '2023-05-26',
          startTime: '09:30',
          endTime: '11:00',
          isRepeat: false,
          sequenceNumber: 1,
          maxSequenceNumber: 1,
        },
        {
          appointmentId: 2,
          appointmentOccurrenceId: 3,
          appointmentType: 'GROUP',
          allocations: [{}, {}, {}],
          category: {
            code: 'TEST2',
            description: 'Test Category 2',
          },
          internalLocation: {
            description: 'Test Location 2',
          },
          startDate: '2022-12-01',
          startTime: '13:00',
          endTime: '14:30',
          isRepeat: true,
          sequenceNumber: 2,
          maxSequenceNumber: 6,
        },
      ],
    }
  })

  it('should display results', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    let resultDate = $('[data-qa=result-date-0]')
    expect(resultDate.text().trim()).toEqual('26 May 2023')
    expect(resultDate.attr('data-sort-value')).toEqual('2023-05-2609:30')
    expect($('[data-qa=result-time-0]').text().trim()).toEqual('09:30 to 11:00')
    expect($('[data-qa=result-category-0]').text().trim()).toEqual('Test Category 1')
    expect($('[data-qa=result-location-0]').text().trim()).toEqual('Test Location 1')
    expect($('[data-qa=result-prisoner-count-0]').text().trim()).toEqual('1')
    expect($('[data-qa=result-sequence-number-0]').text().trim()).toEqual('1 of 1')
    expect($('[data-qa=view-and-edit-result-0]').text().trim()).toEqual('View and manage appointment')
    expect($('[data-qa=view-and-edit-result-0] > a').attr('href')).toEqual('/appointments/1/occurrence/2')

    resultDate = $('[data-qa=result-date-1]')
    expect(resultDate.text().trim()).toEqual('1 Dec 2022')
    expect(resultDate.attr('data-sort-value')).toEqual('2022-12-0113:00')
    expect($('[data-qa=result-time-1]').text().trim()).toEqual('13:00 to 14:30')
    expect($('[data-qa=result-category-1]').text().trim()).toEqual('Test Category 2')
    expect($('[data-qa=result-location-1]').text().trim()).toEqual('Test Location 2')
    expect($('[data-qa=result-prisoner-count-1]').text().trim()).toEqual('3')
    expect($('[data-qa=result-sequence-number-1]').text().trim()).toEqual('2 of 6')
    expect($('[data-qa=view-and-edit-result-1]').text().trim()).toEqual('View and manage appointment')
    expect($('[data-qa=view-and-edit-result-1] > a').attr('href')).toEqual('/appointments/2/occurrence/3')
  })

  it('should not display end time when result does not have an end time', () => {
    viewContext.results = [
      {
        startDate: '2023-05-26',
        startTime: '10:00',
      },
    ]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=result-date-0]').attr('data-sort-value')).toEqual('2023-05-2610:00')
    expect($('[data-qa=result-time-0]').text().trim()).toEqual('10:00')
  })

  it.each([
    [TimeSlot.AM, 'Morning (AM)'],
    [TimeSlot.PM, 'Afternoon (PM)'],
    [TimeSlot.ED, 'Evening (ED)'],
  ])('should select correct time period filter %s %s', (timeSlot, expectedText) => {
    viewContext.timeSlot = timeSlot

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Time period')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('${expectedText}')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter ${expectedText}`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${toDateString(
        new Date(),
      )}&timeSlot=&categoryCode=MEDO&locationId=26151&prisonerNumber=A1234BC&createdBy=all&type=INDIVIDUAL`,
    )

    const checked = $("[name='timeSlot']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(timeSlot)
    expect(
      $(`label[for='${checked.attr('id')}']`)
        .text()
        .trim(),
    ).toEqual(expectedText)
  })

  it('should select correct category filter', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Appointment name')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('Medical - Doctor')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter Medical - Doctor`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${toDateString(
        new Date(),
      )}&timeSlot=am&categoryCode=&locationId=26151&prisonerNumber=A1234BC&createdBy=all&type=INDIVIDUAL`,
    )

    const selected = $("[name='categoryCode'] > option:selected")
    expect(selected.val()).toEqual('MEDO')
    expect(selected.text().trim()).toEqual('Medical - Doctor')
  })

  it('should select correct location filter', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Location')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('Library')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter Library`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${toDateString(
        new Date(),
      )}&timeSlot=am&categoryCode=MEDO&locationId=&prisonerNumber=A1234BC&createdBy=all&type=INDIVIDUAL`,
    )

    const selected = $("[name='locationId'] > option:selected")
    expect(selected.val()).toEqual('26151')
    expect(selected.text().trim()).toEqual('Library')
  })

  it('should use correct prison number filter', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Prison number')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('A1234BC')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter A1234BC`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${toDateString(
        new Date(),
      )}&timeSlot=am&categoryCode=MEDO&locationId=26151&prisonerNumber=&createdBy=all&type=INDIVIDUAL`,
    )

    expect($("[name='prisonerNumber']").val()).toEqual('A1234BC')
  })

  it.each([
    ['test.user', 'Myself'],
    ['all', 'All appointment creators'],
  ])('should select correct created by filter %s %s', (createdBy, expectedText) => {
    viewContext.createdBy = createdBy

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Created by')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('${expectedText}')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter ${expectedText}`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${toDateString(
        new Date(),
      )}&timeSlot=am&categoryCode=MEDO&locationId=26151&prisonerNumber=A1234BC&createdBy=&type=INDIVIDUAL`,
    )

    const checked = $("[name='createdBy']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(createdBy)
    expect(
      $(`label[for='${checked.attr('id')}']`)
        .text()
        .trim(),
    ).toEqual(expectedText)
  })

  it.each([
    [AppointmentType.INDIVIDUAL, 'Individual appointment'],
    [AppointmentType.GROUP, 'Group appointment'],
  ])('should select correct time period filter %s %s', (type, expectedText) => {
    viewContext.type = type

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Individual or group')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('${expectedText}')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter ${expectedText}`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${toDateString(
        new Date(),
      )}&timeSlot=am&categoryCode=MEDO&locationId=26151&prisonerNumber=A1234BC&createdBy=all&type=`,
    )

    const checked = $("[name='type']:checked")
    expect(checked.length).toEqual(1)
    expect(checked.val()).toEqual(type)
    expect(
      $(`label[for='${checked.attr('id')}']`)
        .text()
        .trim(),
    ).toEqual(expectedText)
  })
})
