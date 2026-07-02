[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-activities-management)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/hmpps-activities-management 'Link to report')
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-activities-management)

# hmpps-activities-management

This application is the frontend client for the activities management service. It is used to manage activities and appointments in prisons.

The client is backed by, [hmpps-activities-management-api](https://github.com/ministryofjustice/hmpps-activities-management-api).

## Dependencies

This service is dependent the following services:

- [Auth API](https://sign-in-dev.hmpps.service.justice.gov.uk/auth/swagger-ui/index.html) - authorisation and authentication
- [Activities Management API](https://activities-api-dev.prison.service.justice.gov.uk/swagger-ui/index.html#/) - activities management api
- [Alerts API](https://alerts-api-dev.hmpps.service.justice.gov.uk/swagger-ui/index.html#/) - alerts api
- [Book A Video Link API](https://book-a-video-link-api-dev.prison.service.justice.gov.uk/swagger-ui/index.html#/) - book a video link api
- [Case Notes API](https://dev.offender-case-notes.service.justice.gov.uk/swagger-ui/index.html#/) - case notes api
- [Incentives API](https://incentives-api-dev.hmpps.service.justice.gov.uk/swagger-ui/index.html#/) - incentives api
- [Locations Inside Prison API](https://locations-inside-prison-api-dev.hmpps.service.justice.gov.uk/swagger-ui/index.html#/) - locations inside prison api
- [Nomis Mapping API](https://nomis-sync-prisoner-mapping-dev.hmpps.service.justice.gov.uk/swagger-ui/index.html#/) - nomis mapping api
- [Non-Associations API](https://non-associations-api-dev.hmpps.service.justice.gov.uk/swagger-ui/index.html#/) - non-associations api
- [Prison API](https://prison-api-dev.prison.service.justice.gov.uk/swagger-ui/index.html#/) - prison api
- [Prisoner Search API](https://prisoner-search-dev.prison.service.justice.gov.uk/swagger-ui/index.html#/) - prisoner search api
- [Redis](https://redis.io/)/[Elasticache](https://aws.amazon.com/elasticache/) - journey, session store and token caching

## Generating Open API Types

There are various services which should have their types regenerated:

```
./generate-activities-types.sh
./generate-alerts-types.sh
./generate-book-a-video-link-api-types.sh
./generate-case-note-types.sh
./generate-incentives-api-types.sh
./generate-manage-users-api-types.sh
./generate-nomis-user-api-types.sh
./generate-non-associations-types.sh
./generate-prison-api-types.sh
./generate-prisoner-offender-search-types.sh
```

## Alerts

- The icons for badges can be obtained from the `digital-prison-services` repository [here](https://github.com/ministryofjustice/digital-prison-services/tree/main/static/images).

## Running the application

Ensure you have the appropriate tools locally:

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the github pipeline build config.

`node - v24.x`

`npm - v11.x`

Then install dependencies:

`$ npm install` - to pull and install dependent node modules.

### Create your .env

Using the `.env-template` file as a template, copy to a new `.env` file `cp .env-template .env`

The following values can be extracted from the cluster:

```
API_CLIENT_ID=
API_CLIENT_SECRET=
SYSTEM_CLIENT_ID=
SYSTEM_CLIENT_SECRET=
```

To extract these values, the following commands are used - N.B. access to the K8s cluster is required to extract these values:

```
kubectl -n hmpps-activities-management-dev get secrets hmpps-activities-management-api -o json | jq -r ".data | map_values(@base64d)"
kubectl -n hmpps-activities-management-dev get secrets hmpps-activities-management -o json | jq -r ".data | map_values(@base64d)"
```

### Starting the application

Once dependencies are installed to build and start the app for local development:

`npm run start:dev` – builds and starts application with nodemon

Or for production:

`$ npm run build` - to compile SCSS files & populate the /dist folder

`$ npm run start` - starts application from /dist

## Run linter

`$ npm run lint` - to run the linter over the code

## Unit tests

`$ npm run test` - to run unit tests

## Integration tests (Cypress/Wiremock)

**Quick start commands**

To run the entire Cypress suite locally: `npm run int-test:local`
To run the interactive Cypress UI locally: `npm run int-test-ui:local`

Alternativaly, the follow steps allow manual running:

Pull images and start dependent services (redis and wiremock):

`$ docker compose -f docker-compose-integration.yml pull`

`$ docker compose -f docker-compose-integration.yml up -d`

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

Ensure your `.env` file is set up.

Start the required containers:

`$ docker-compose -f docker-compose.yml up -d`

Start a local `hmpps-activities-management` service with `$ npm run start`, which will use you `.env` file to set
up its environment to reference the DEV APIs, local activities API and local containers.

## Digital Prison Reporting (DPR)

DPR integration has been started and first report is available [here](https://activities-dev.prison.service.justice.gov.uk/dpr-reporting/waitlist-agg).

Not easy to test locally as endpoints are not available.

Docs are [here](https://ministryofjustice.github.io/hmpps-digital-prison-reporting-frontend/components/list-report/)
