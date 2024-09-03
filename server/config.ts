import 'dotenv/config'
import { PathParams } from 'express-serve-static-core'

const production = process.env.NODE_ENV === 'production'

const Roles = {
  ACTIVITY_HUB: 'ROLE_ACTIVITY_HUB',
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
  https: production,
  staticResourceCacheDuration: production ? '1h' : 0,
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
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 5000))),
    },
    frontendComponents: {
      url: get('FRONTEND_COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('FRONTEND_COMPONENT_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('FRONTEND_COMPONENT_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('FRONTEND_COMPONENT_API_TIMEOUT_RESPONSE', 5000))),
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
      timeout: Number(get('REPORTING_API_TIMEOUT_RESPONSE', 10000)),
    },
    bookAVideoLinkApi: {
      url: get('BOOK_A_VIDEO_LINK_API_URL', 'http://localhost:8095'),
      timeout: {
        response: Number(get('BOOK_A_VIDEO_LINK_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('BOOK_A_VIDEO_LINK_API_TIMEOUT_DEADLINE', 30000)),
      },
      agent: new AgentConfig(Number(get('BOOK_A_VIDEO_LINK_API_TIMEOUT_RESPONSE', 30000))),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  dpsUrl: get('DPS_URL', 'https://digital-dev.prison.service.justice.gov.uk', requiredInProduction),
  reportAFaultUrl: get('REPORT_A_FAULT_URL', '#', requiredInProduction),
  feedbackUrl: get('FEEDBACK_URL', '#', requiredInProduction),
  routeAuth: [
    {
      route: '/activities/allocation-dashboard',
      roles: [Roles.ACTIVITY_HUB],
    },
    {
      route: '/activities/:mode(create|edit|view)',
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
  spikesFeatureToggleEnabled: Boolean(get('SPIKES_FEATURE_TOGGLE_ENABLED', false)),
  allocateToNextSession: Boolean(get('ALLOCATE_TO_NEXT_SESSION', false)),
  frontendComponentsApiToggleEnabled: Boolean(
    get('FRONTEND_COMPONENTS_API_FEATURE_TOGGLE_ENABLED', true, requiredInProduction),
  ),
  bookAVideoLinkToggleEnabled: Boolean(get('BOOK_A_VIDEO_LINK_FEATURE_TOGGLE_ENABLED', false)) || !production,
  futurePayRatesToggleEnabled: Boolean(get('FUTURE_PAY_RATES_TOGGLE_ENABLED', false)),
  customStartEndTimesEnabled: Boolean(get('CUSTOM_START_END_TIMES_ENABLED', false)),
  twoWeeklyCustomStartEndTimesEnabled: Boolean(get('TWO_WEEKLY_CUSTOM_START_END_TIMES_ENABLED', false)),
  appointmentsConfig: {
    maxAppointmentInstances: Number(get('MAX_APPOINTMENT_INSTANCES', 20000)),
  },
}
