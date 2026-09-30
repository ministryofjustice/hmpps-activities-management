import { smokeArea } from './support/run'
import { JourneyData } from '../../../server/@types/express'
import setupLogWaitlistApplicationScenario from '../helpers/activities/waitlist/logWaitlistApplication'
import { stubWaitlistDashboard, stubWaitlistApplicationView } from '../helpers/activities/waitlist/stubs'
import { buildWaitlistApplication } from '../helpers/activities/waitlist/fixtures'

const application = buildWaitlistApplication()
const setup = async () => {
  await setupLogWaitlistApplicationScenario()
  await stubWaitlistApplicationView({ application })
  await stubWaitlistDashboard([application])
}
const journey: JourneyData = {
  waitListApplicationJourney: {
    prisoner: { prisonerNumber: 'A1350DZ', name: 'David Winchurch' },
    requestDate: '2025-06-20',
    activity: { activityId: 1, scheduleId: 2, activityName: 'Maths level 1' },
    requester: 'PRISONER',
    status: 'PENDING',
    comment: 'Smoke test',
    createdTime: '2025-06-20T10:00:00',
  },
}
smokeArea('activities/waitlist-application', setup, journey)
smokeArea('activities/waitlist-dashboard', setup)
