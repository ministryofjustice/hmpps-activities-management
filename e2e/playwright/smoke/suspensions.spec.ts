import { smokeArea } from './support/run'
import { stubSuspensions, suspensionJourney } from './support/suspensions'

smokeArea('activities/suspensions', stubSuspensions, suspensionJourney)
