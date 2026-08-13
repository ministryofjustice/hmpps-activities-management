import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/waitlist-application/confirmation.njk')

const viewContext = (status: string) => ({
  waitListApplicationJourney: {
    prisoner: {
      name: 'Alan Key',
      prisonerNumber: 'ABC123',
    },
    activity: {
      activityId: 1,
      activityName: 'Maths level 1',
    },
    status,
  },
  waitlistSize: 2,
  vacancies: 2,
  currentlyAllocated: 3,
  capacity: 5,
})

describe('Views - Waitlist application - Confirmation', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should display an approved application status', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext('APPROVED')))

    expect($('.govuk-panel__body').text().trim()).toBe('The application status is Approved')
  })

  it('should display a declined application status', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext('DECLINED')))

    expect($('.govuk-panel__body').text().trim()).toBe('The application status is Declined')
  })
})
