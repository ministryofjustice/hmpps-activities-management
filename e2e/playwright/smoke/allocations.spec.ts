import { smokeArea } from './support/run'
import { allocationJourney, stubAllocations } from './support/allocations'

smokeArea('activities/manage-allocations', stubAllocations, allocationJourney)
smokeArea('activities/exclusions', stubAllocations)
smokeArea('activities/non-associations', stubAllocations)
