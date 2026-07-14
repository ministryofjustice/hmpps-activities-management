import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/manage-allocations/confirm-exclusions.njk')

describe('Views - Manage Allocations - Confirm Exclusions', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should not show the add to today row when no future same-day slots exist', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [],
      addToSessionsToday: 'NO',
      addToTodayText: null,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list__row').length).toBe(2)
    expect($('.govuk-summary-list').text()).not.toContain('Add to')
  })

  it('should show no changes message when no slots are added or excluded', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [],
      addToSessionsToday: 'NO',
      addToTodayText: null,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-body').text()).toContain('You are not making any changes to when Jack Bloggs should attend.')
  })

  it('should show changes take effect message when slots are added', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: { 1: [{ day: 'Monday', slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '12:00' }] }] },
      futureSameDaySlots: [],
      addToSessionsToday: 'NO',
      addToTodayText: null,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-body').text()).toContain(
      'Changes take effect on unlock, movement and attendance lists from tomorrow.',
    )
  })

  it('should show modified out message and changes message when slots are excluded', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: { 1: [{ day: 'Monday', slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '12:00' }] }] },
      addedSlots: {},
      futureSameDaySlots: [],
      addToSessionsToday: 'NO',
      addToTodayText: null,
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    const bodyText = $('.govuk-body').text()

    expect(bodyText).toContain(
      'Sessions someone has been modified out of will need to be added back to their schedule before they can attend again.',
    )
    expect(bodyText).toContain('Changes take effect on unlock, movement and attendance lists from tomorrow.')
  })

  it('should show the add to today row in the summary list when futureSameDaySlots exist', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [{ timeSlot: 'AM' }],
      addToSessionsToday: 'NO',
      addToTodayText: "today's AM session",
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list').text()).toContain("Add to today's AM session?")
  })

  it('should show the current addToSessionsToday value in the summary list', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [{ timeSlot: 'AM' }],
      addToSessionsToday: 'Yes',
      addToTodayText: "today's AM session",
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-summary-list__value').eq(1).text().trim()).toBe('Yes')
  })

  it('should show correct paragraph text when addToSessionsToday is YES', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [{ timeSlot: 'AM' }],
      addToSessionsToday: 'YES',
      addToTodayText: "today's AM session",
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('.govuk-body').text()).toContain(
      "They’ll be added to today's AM session. All other changes take effect on unlock, movement and attendance lists from tomorrow.",
    )
  })

  it('should show correct paragraph text when addToSessionsToday is NO', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [{ timeSlot: 'AM' }],
      addToSessionsToday: 'NO',
      addToTodayText: "today's AM session",
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))
    const bodyText = $('.govuk-body').text()

    expect(bodyText).toContain('Changes take effect on unlock, movement and attendance lists from tomorrow.')
    expect(bodyText).not.toContain("They'll be added to")
  })

  it('should show change link for add to today row pointing to addToToday', () => {
    const viewContext = {
      allocateJourney: {
        inmate: { prisonerName: 'Jack Bloggs' },
        activity: { name: 'Maths class', scheduleWeeks: 1 },
      },
      excludedSlots: {},
      addedSlots: {},
      futureSameDaySlots: [{ timeSlot: 'AM' }],
      addToSessionsToday: 'NO',
      addToTodayText: "today's AM session",
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    const changeLinks = $('.govuk-summary-list__actions a')
    const addToTodayLink = changeLinks.filter((_, el) => $(el).attr('href') === 'addToToday?preserveHistory=true')

    expect(addToTodayLink.text().trim()).toContain('Change')
  })
})
