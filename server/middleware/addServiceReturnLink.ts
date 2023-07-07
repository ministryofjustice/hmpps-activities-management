import type { Request, Response, NextFunction } from 'express'

export default function addServiceReturnLink(serviceReturnLinkText: string, serviceReturnLinkHref: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals = {
      ...res.locals,
      serviceReturnLinkText,
      serviceReturnLinkHref,
    }

    next()
  }
}
