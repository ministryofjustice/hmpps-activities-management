import { VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import type { Request } from 'express'
import config from '../config'
import logger from '../../logger'

const verificationClient = new VerificationClient(config.apis.tokenVerification, logger)

export type TokenVerifier = (request: Request) => Promise<boolean | void>

const tokenVerifier: TokenVerifier = request =>
  verificationClient.verifyToken(request as Parameters<typeof verificationClient.verifyToken>[0])

export default tokenVerifier
