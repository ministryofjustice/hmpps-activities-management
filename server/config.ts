import 'dotenv/config'
import { PathParams } from 'express-serve-static-core'

const production = process.env.NODE_ENV === 'production'

const Roles = {
  ACTIVITY_HUB: 'ROLE_ACTIVITY_HUB',
}

const toBoolean = (value: string): boolean => {
  return value === 'true'
}

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

interface RouteAuth {
  route: PathParams
  roles: string[]
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: process.env.NO_HTTPS === 'true' ? false : production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:8088', requiredInProduction),
      timeout: {
        // Manage users API often has an internal 5s timeout with retry so we should give the retry a chance to work
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 12000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 12000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 12000))),
    },
    activitiesApi: {
      url: get('ACTIVITIES_API_URL', 'http://localhost:8089', requiredInProduction),
      timeout: {
        response: Number(get('ACTIVITIES_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('ACTIVITIES_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('ACTIVITIES_API_TIMEOUT_RESPONSE', 30000))),
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('PRISON_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('PRISON_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('PRISON_API_TIMEOUT_RESPONSE', 30000))),
    },
    prisonerSearchApi: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8090', requiredInProduction),
      timeout: {
        response: Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 30000))),
    },
    prisonRegisterApi: {
      url: get('PRISON_REGISTER_API_URL', 'http://localhost:8092', requiredInProduction),
      timeout: {
        response: Number(get('PRISON_REGISTER_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('PRISON_REGISTER_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('PRISON_REGISTER_API_TIMEOUT_RESPONSE', 30000))),
    },
    incentivesApi: {
      url: get('INCENTIVES_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('INCENTIVES_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('INCENTIVES_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('INCENTIVES_API_TIMEOUT_RESPONSE', 30000))),
    },
    caseNotesApi: {
      url: get('CASE_NOTES_API_URL', 'http://localhost:8094', requiredInProduction),
      timeout: {
        response: Number(get('CASE_NOTES_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('CASE_NOTES_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('CASE_NOTES_API_TIMEOUT_RESPONSE', 30000))),
    },
    reporting: {
      url: get('REPORTING_API_URL', 'http://localhost:3010', requiredInProduction),
      timeout: Number(get('REPORTING_API_TIMEOUT_RESPONSE', 30000)),
    },
    bookAVideoLinkApi: {
      url: get('BOOK_A_VIDEO_LINK_API_URL', 'http://localhost:8095', requiredInProduction),
      timeout: {
        response: Number(get('BOOK_A_VIDEO_LINK_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('BOOK_A_VIDEO_LINK_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('BOOK_A_VIDEO_LINK_API_TIMEOUT_RESPONSE', 30000))),
    },
    nonAssociationsApi: {
      url: get('NON_ASSOCIATIONS_API_URL', 'http://localhost:8096', requiredInProduction),
      timeout: {
        response: Number(get('NON_ASSOCIATIONS_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('NON_ASSOCIATIONS_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('NON_ASSOCIATIONS_API_TIMEOUT_RESPONSE', 30000))),
    },
    alertsApi: {
      url: get('ALERTS_API_URL', 'http://localhost:8097', requiredInProduction),
      timeout: {
        response: Number(get('ALERTS_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('ALERTS_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('ALERTS_API_TIMEOUT_RESPONSE', 30000))),
    },
    locationsInsidePrisonApi: {
      url: get('LOCATIONS_INSIDE_PRISON_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('LOCATIONS_INSIDE_PRISON_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('LOCATIONS_INSIDE_PRISON_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('LOCATIONS_INSIDE_PRISON_API_TIMEOUT_DEADLINE', 30000))),
    },
    nomisMapping: {
      url: get('NOMIS_MAPPING_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('NOMIS_MAPPING_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('NOMIS_MAPPING_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('NOMIS_MAPPING_API_TIMEOUT_RESPONSE', 30000))),
    },
    bankHolidaysApi: {
      url: get('BANK_HOLIDAYS_API_URL', 'https://www.gov.uk/bank-holidays.json', requiredInProduction),
      timeout: {
        response: Number(get('BANK_HOLIDAYS_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('BANK_HOLIDAYS_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('BANK_HOLIDAYS_API_TIMEOUT_RESPONSE', 30000))),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  analytics: {
    tagManagerContainerId: get('TAG_MANAGER_CONTAINER_ID', ''),
    tagManagerEnvironment: get('TAG_MANAGER_ENVIRONMENT', ''),
  },
  dpsUrl: get('DPS_URL', 'https://digital-dev.prison.service.justice.gov.uk', requiredInProduction),
  prisonerUrl: get('PRISONER_URL', 'https://prisoner-dev.digital.prison.service.justice.gov.uk', requiredInProduction),
  incentivesUrl: get('INCENTIVES_URL', 'https://incentives-ui-dev.hmpps.service.justice.gov.uk', requiredInProduction),
  videoConferenceScheduleUrl: get(
    'VIDEO_CONFERENCE_SCHEDULE_URL',
    'https://video-conference-schedule-dev.prison.service.justice.gov.uk',
    requiredInProduction,
  ),
  nonAssociationsUrl: get(
    'NON_ASSOCIATIONS_URL',
    'https://non-associations-dev.hmpps.service.justice.gov.uk',
    requiredInProduction,
  ),
  reportAFaultUrl: get('REPORT_A_FAULT_URL', '#', requiredInProduction),
  feedbackUrl: get('FEEDBACK_URL', '#', requiredInProduction),
  routeAuth: [
    {
      route: '/activities/allocation-dashboard',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/create',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/edit',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/view',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/dashboard',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/allocate',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/exclusions',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/change-of-circumstances',
      roles: [Roles.ACTIVITY_HUB],
    },
  ] as RouteAuth[],
  spikesFeatureToggleEnabled: toBoolean(get('SPIKES_FEATURE_TOGGLE_ENABLED', 'false')),
  appointmentMultipleAttendanceToggleEnabled: toBoolean(
    get('APPOINTMENT_MULTIPLE_ATTENDANCE_FEATURE_TOGGLE_ENABLED', 'false'),
  ),
  inServiceReportingEnabled: toBoolean(get('IN_SERVICE_REPORTING_ENABLED', 'false')),
  multiplePrisonerActivityAllocationEnabled: toBoolean(get('MULTIPLE_PRISONER_ALLOCATION_ENABLED', 'false')),
  uncancelMultipleSessionsEnabled: toBoolean(get('UNCANCEL_MULTIPLE_SESSIONS_ENABLED', 'false')),
  notRequiredInAdvanceEnabled: toBoolean(get('NOT_REQUIRED_IN_ADVANCE_ENABLED', 'false')),
  appointmentsConfig: {
    maxAppointmentInstances: Number(get('MAX_APPOINTMENT_INSTANCES', 20000)),
  },
  liveIssueOutageBannerEnabled: toBoolean(get('LIVE_ISSUE_OUTAGE_BANNER_ENABLED', 'false')),
  plannedDowntimeOutageBannerEnabled: toBoolean(get('PLANNED_DOWNTIME_OUTAGE_BANNER_ENABLED', 'false')),
  plannedDowntimeDate: Date.parse(get('PLANNED_DOWNTIME_DATE', new Date().toLocaleDateString())),
  plannedDowntimeStartTime: get('PLANNED_DOWNTIME_START_TIME', '9am'),
  plannedDowntimeEndTime: get('PLANNED_DOWNTIME_END_TIME', '5pm'),
  prisonerAllocationsEnabled: toBoolean(get('PRISONER_ALLOCATIONS_ENABLED', 'false')),
  bvlsHmctsLinkGuestPinEnabled: toBoolean(get('BVLS_FEATURE_HMCTS_LINK_GUEST_PIN', 'false', requiredInProduction)),
  defaultCourtVideoUrl: get('DEFAULT_COURT_VIDEO_URL', 'meet.video.justice.gov.uk'),
}
