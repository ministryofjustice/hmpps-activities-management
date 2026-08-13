import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import {
  WaitingListAllocationStatusOptions,
  WaitingListStatus,
  WaitingListStatusDescriptions,
} from '../../../../enum/waitingListStatus'

const view = fs.readFileSync('server/views/pages/activities/waitlist-application/edit-status.njk')
const normalizedText = (text: string) => text.replace(/\s+/g, ' ').trim()

describe('Views - Waitlist application - Edit status', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const viewContext = (status: WaitingListAllocationStatusOptions) => ({
    prisonerName: 'David Winchurch',
    WaitingListAllocationStatusOptions,
    WaitingListStatus,
    WaitingListStatusDescriptions,
    waitListApplicationJourney: {
      status,
      activity: {
        activityName: 'Maths level 1',
      },
    },
  })

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should display the correct options when the current status is pending', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(WaitingListAllocationStatusOptions.PENDING)))

    expect(normalizedText($('.govuk-inset-text').text())).toBe('Current status: Pending')

    expect($('.govuk-hint').text()).toContain(
      'You can approve this application, reject it, or withdraw it to remove David Winchurch from the waitlist.',
    )

    expect($('input[name="status"][value="PENDING"]')).toHaveLength(0)
    expect($('input[name="status"][value="APPROVED"]')).toHaveLength(1)
    expect($('input[name="status"][value="DECLINED"]')).toHaveLength(1)
    expect($('input[name="status"][value="WITHDRAWN"]')).toHaveLength(1)
  })

  it('should display the correct options when the current status is approved', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(WaitingListAllocationStatusOptions.APPROVED)))

    expect(normalizedText($('.govuk-inset-text').text())).toBe('Current status: Approved and on the waitlist')

    expect($('.govuk-hint').text()).toContain(
      'You can change the status to pending if more checks are needed, reject it, or withdraw it to remove David Winchurch from the waitlist.',
    )

    expect($('input[name="status"][value="APPROVED"]')).toHaveLength(0)
    expect($('input[name="status"][value="PENDING"]')).toHaveLength(1)
    expect($('input[name="status"][value="DECLINED"]')).toHaveLength(1)
    expect($('input[name="status"][value="WITHDRAWN"]')).toHaveLength(1)
  })

  it('should display the correct options when the current status is rejected', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(WaitingListAllocationStatusOptions.DECLINED)))

    expect(normalizedText($('.govuk-inset-text').text())).toBe('Current status: Rejected')

    expect($('.govuk-hint').text()).toContain(
      'You can approve this application, change it to pending if more checks are needed, or withdraw it to remove David Winchurch from the waitlist.',
    )

    expect($('input[name="status"][value="DECLINED"]')).toHaveLength(0)
    expect($('input[name="status"][value="APPROVED"]')).toHaveLength(1)
    expect($('input[name="status"][value="PENDING"]')).toHaveLength(1)
    expect($('input[name="status"][value="WITHDRAWN"]')).toHaveLength(1)
  })
})
