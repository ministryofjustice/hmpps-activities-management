import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { addDays } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import TimeSlot from '../../../../enum/timeSlot'
import { formatDate } from '../../../../utils/utils'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'

const view = fs.readFileSync('server/views/pages/appointments/search/results.njk')

describe('Views - Appointments Management - Appointment Search Results', () => {
  let compiledTemplate: Template
  let viewContext = {
    user: {
      username: '',
    },
    startDate: formatIsoDate(new Date()),
    timeSlots: ['AM'],
    appointmentNameFilters: [{}],
    appointmentName: '',
    locations: [{}],
    locationId: 1,
    prisonerNumber: '',
    createdBy: '',
    results: [{}],
    prisonersDetails: {},
  }

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
    viewContext = {
      user: {
        username: 'test.user',
      },
      startDate: formatIsoDate(new Date()),
      timeSlots: ['AM', 'PM'],
      appointmentNameFilters: ['Chaplaincy', 'Medical - Doctor', 'Gym - Weights'],
      appointmentName: 'Medical - Doctor',
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
      results: [
        {
          appointmentSeriesId: 1,
          appointmentId: 2,
          appointmentType: 'INDIVIDUAL',
          appointmentName: 'Test appointment name 1 (Test Category 1)',
          attendees: [
            {
              prisonerNumber: 'A1111AA',
            },
          ],
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
          isExpired: false,
          isCancelled: false,
        },
        {
          appointmentSeriesId: 2,
          appointmentId: 3,
          appointmentType: 'GROUP',
          appointmentName: 'Test appointment name 2 (Test Category 2)',
          attendees: [
            {
              prisonerNumber: 'A1111AA',
            },
            {
              prisonerNumber: 'B2222BB',
            },
            {
              prisonerNumber: 'C3333CC',
            },
          ],
          category: {
            code: 'TEST2',
            description: 'Test Category 2',
          },
          inCell: true,
          startDate: '2022-12-01',
          startTime: '13:00',
          endTime: '14:30',
          isRepeat: true,
          sequenceNumber: 2,
          maxSequenceNumber: 6,
          isExpired: true,
          isCancelled: false,
        },
        {
          appointmentSeriesId: 3,
          appointmentId: 4,
          appointmentType: 'GROUP',
          appointmentName: 'Test appointment name 3 (Test Category 3)',
          attendees: [
            {
              prisonerNumber: 'A1111AA',
            },
            {
              prisonerNumber: 'B2222BB',
            },
            {
              prisonerNumber: 'C3333CC',
            },
          ],
          category: {
            code: 'TEST3',
            description: 'Test Category 3',
          },
          internalLocation: {
            description: 'Test Location 3',
          },
          startDate: '2022-12-01',
          startTime: '16:00',
          endTime: '17:30',
          isRepeat: true,
          sequenceNumber: 2,
          maxSequenceNumber: 6,
          isExpired: false,
          isCancelled: true,
        },
      ],
      prisonersDetails: {
        A1111AA: {
          firstName: 'Lee',
          lastName: 'Jacobson',
          prisonerNumber: 'A1111AA',
          cellLocation: '1-1-1',
        },
      },
    }
  })

  it('should display results', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=result-time-0]').text().trim()).toEqual('09:30 to 11:00')
    expect($('[data-qa=result-appointment-name-0]').text().trim()).toEqual('Test appointment name 1 (Test Category 1)')
    expect($('[data-qa=result-location-0]').text().trim()).toEqual('Test Location 1')
    expect($('[data-qa=result-prisoner-count-0]').text().trim()).toContain('Jacobson, Lee')
    expect($('[data-qa=result-prisoner-count-0]').text().trim()).toContain('A1111AA')
    expect($('[data-qa=result-prisoner-count-0]').text().trim()).toContain('1-1-1')
    expect($('[data-qa=result-sequence-number-0]').text().trim()).toEqual('1 of 1')
    expect($('[data-qa=view-and-edit-result-0] > a').text()).toContain('Manage details')
    expect($('[data-qa=view-and-edit-result-0] > a').attr('href')).toEqual('/appointments/2')

    expect($('[data-qa=result-time-1]').text().trim()).toEqual('13:00 to 14:30')
    expect($('[data-qa=result-appointment-name-1]').text().trim()).toEqual('Test appointment name 2 (Test Category 2)')
    expect($('[data-qa=result-location-1]').text().trim()).toEqual('In cell')
    expect($('[data-qa=result-prisoner-count-1]').text().trim()).toEqual('3')
    expect($('[data-qa=result-sequence-number-1]').text().trim()).toEqual('2 of 6')
    expect($('[data-qa=view-and-edit-result-1] > a').text()).toContain('View')
    expect($('[data-qa=view-and-edit-result-1] > a').text()).not.toContain('Manage details')
    expect($('[data-qa=view-and-edit-result-1] > a').attr('href')).toEqual('/appointments/3')

    expect($('[data-qa=result-time-2]').text().trim()).toEqual('16:00 to 17:30')
    expect($('[data-qa=result-appointment-name-2]').text().trim()).toEqual('Test appointment name 3 (Test Category 3)')
    expect($('[data-qa=result-location-2]').text().trim()).toEqual('Test Location 3')
    expect($('[data-qa=result-prisoner-count-2]').text().trim()).toEqual('3')
    expect($('[data-qa=result-sequence-number-2]').text().trim()).toEqual('2 of 6')
    expect($('[data-qa=view-and-edit-result-2] > a').text()).toContain('View')
    expect($('[data-qa=view-and-edit-result-2] > a').text()).not.toContain('Manage details')
    expect($('[data-qa=view-and-edit-result-2] > a').attr('href')).toEqual('/appointments/4')
  })

  it('should not display end time when result does not have an end time', () => {
    viewContext.results = [
      {
        startDate: '2023-05-26',
        startTime: '10:00',
      },
    ]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=result-time-0]').text().trim()).toEqual('10:00')
  })

  it('clear filters does not appear if only start date filter is applied', () => {
    const tomorrow = addDays(new Date(), 1)

    const $ = cheerio.load(compiledTemplate.render({ startDate: formatIsoDate(tomorrow), timeSlots: [] }))

    expect($("a:contains('Clear filters')").length).toEqual(0)
  })

  it('should use correct start date filter', () => {
    const tomorrow = addDays(new Date(), 1)
    viewContext.startDate = formatIsoDate(tomorrow)

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const clearFiltersLink = $("a:contains('Clear filters')")
    expect(clearFiltersLink.length).toEqual(1)
    expect(clearFiltersLink.attr('href')).toEqual(`?startDate=${formatIsoDate(tomorrow)}`)

    expect($(".moj-filter__selected > h3:contains('Date')").length).toEqual(0)

    expect($("[name='startDate']").val()).toEqual(formatDatePickerDate(tomorrow))

    expect($("[data-qa='start-date-caption']").text()).toEqual(formatDate(tomorrow, 'EEEE, d MMMM yyyy'))
  })

  it.each([
    [TimeSlot.AM, 'Morning (AM)'],
    [TimeSlot.PM, 'Afternoon (PM)'],
    [TimeSlot.ED, 'Evening (ED)'],
  ])('should select correct time period filter %s %s', (timeSlot, expectedText) => {
    viewContext.timeSlots = [timeSlot]

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Session')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('${expectedText}')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter ${expectedText}`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${formatIsoDate(
        new Date(),
      )}&timeSlots=&appointmentName=Medical - Doctor&locationId=26151&prisonerNumber=A1234BC&createdBy=all`,
    )

    const checked = $("[name='timeSlots']:checked")
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
      `?startDate=${formatIsoDate(
        new Date(),
      )}&timeSlots=am,pm&appointmentName=&locationId=26151&prisonerNumber=A1234BC&createdBy=all`,
    )

    const selected = $("[name='appointmentName'] > option:selected")
    expect(selected.val()).toEqual('Medical - Doctor')
    expect(selected.text().trim()).toEqual('Medical - Doctor')
  })

  it('should select correct location filter', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($(".moj-filter__selected > h3:contains('Location')").length).toEqual(1)
    const removeFilterLink = $(`a.moj-filter__tag:contains('Library')`)
    expect(removeFilterLink.text().trim()).toEqual(`Remove this filter Library`)
    expect(removeFilterLink.attr('href')).toEqual(
      `?startDate=${formatIsoDate(
        new Date(),
      )}&timeSlots=am,pm&appointmentName=Medical - Doctor&locationId=&prisonerNumber=A1234BC&createdBy=all`,
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
      `?startDate=${formatIsoDate(
        new Date(),
      )}&timeSlots=am,pm&appointmentName=Medical - Doctor&locationId=26151&prisonerNumber=&createdBy=all`,
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
      `?startDate=${formatIsoDate(
        new Date(),
      )}&timeSlots=am,pm&appointmentName=Medical - Doctor&locationId=26151&prisonerNumber=A1234BC&createdBy=`,
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
})
