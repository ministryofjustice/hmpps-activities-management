import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { Request } from 'express'
import getSanitisedError from '../sanitisedError'
import config from '../config'
import logger from '../../logger'

const tokenVerificationClient = new RestClient('tokenVerificationApi', config.apis.tokenVerification, logger)

function getApiClientToken(token: string) {
  return tokenVerificationClient
    .post<{ active?: boolean }>(
      {
        path: '/token/verify',
        data: '',
      },
      token || '',
    )
    .then(response => Boolean(response && response.active))
    .catch(error => {
      logger.error(getSanitisedError(error), 'Error calling tokenVerificationApi')
    })
}

export type TokenVerifier = (request: Request) => Promise<boolean | void>

const tokenVerifier: TokenVerifier = async request => {
  const { user, verified } = request

  if (!config.apis.tokenVerification.enabled) {
    logger.debug('Token verification disabled, returning token is valid')
    return true
  }

  if (verified) {
    return true
  }

  logger.debug(`token request for user "${user.username}'`)

  const result = await getApiClientToken(user.token)
  if (result) {
    request.verified = true
  }
  return result
}

export default tokenVerifier
