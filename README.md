# hmpps-activities-management
Managing activities in prisons.

## Dependencies

This service requires the following dependent services:

* `hmpps-auth` - authorisation and authentication
* `redis` - session store and token caching
* `hmpps-activities-management-api` - activities data
* `prisoner-offender-search` - prisoner search API
* `prison-api` - prisoner detail API

## Building

Ensure you have the appropriate tools locally:

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the CircleCI build config.

`node - v18.x`

`npm - v8.x`

Then:

`$ npm install` - to pull and install dependent node modules.

`$ npm run build` - to compile SCSS files & populate the /dist folder.

`$ npm run lint` - to run the linter over the code


## Unit tests

`$ npm run test` - to run unit tests


## Integration tests (Cypress/Wiremock)

Pull images and start dependent services (redis and wiremock):

`$ docker-compose pull`

`$ docker-compose up -d`

In a different terminal:

`$ npm run build` - to compile ts and resources

`$ npm run start-feature` - to start the UI service with env settings to reference locally-mocked (wiremock) APIs:

In a third terminal:

`$ npm run int-test` - to run Cypress tests in the background

OR

`$ npm run int-test-ui` - to run tests interactively


## Running locally (against DEV auth & APIs)

The essential local containers are - `redis` and `postgres`. All other dependent services
can be consumed from their DEV environment locations.

`$ docker-compose pull` - To pull the latest images.

Create a `.env` file containing the following environment variables:

```
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
TOKEN_VERIFICATION_API_URL=https://token-verification-api-dev.prison.service.justice.gov.uk
ACTIVITIES_API_URL=https://activities-api-dev.prison.service.justice.gov.uk
PRISON_API_URL=https://api-dev.prison.service.justice.gov.uk
PRISON_REGISTER_API_URL=https://prison-register-dev.hmpps.service.justice.gov.uk
PRISONER_SEARCH_API_URL=https://prisoner-offender-search-dev.prison.service.justice.gov.uk
WHEREABOUTS_API_URL=https://whereabouts-api-dev.service.justice.gov.uk
NOMIS_USER_API_URL=https://nomis-user-dev.aks-dev-1.studio-hosting.service.justice.gov.uk
INCENTIVES_API_URL=https://incentives-api-dev.hmpps.service.justice.gov.uk
API_CLIENT_ID=<ask the team>
API_CLIENT_SECRET=<ask the team>
SYSTEM_CLIENT_ID=<ask the team>
SYSTEM_CLIENT_SECRET=<ask the team>
```

Start the required containers:

`$ docker-compose -f docker-compose.yaml up -d`

Start a local `hmpps-activities-management-api` service with the `$ ./run-local.sh` script.
This will setup essential environment variables - local DB credentials, API URLs etc.

Start a local `hmpps-activities-management` service with `$ npm run start`, which will use you `.env` file to set
up its environment to reference the DEV APIs, local activities API and local containers.

## Run linter

`npm run lint`

## Ensuring slack notifications are raised correctly

To ensure notifications are routed to the correct slack channels, update the `alerts-slack-channel` and `releases-slack-channel` parameters in `.circle/config.yml` to an appropriate channel.
