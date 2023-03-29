import { Router, ErrorRequestHandler } from 'express'
import multer, { MulterError } from 'multer'

export default function setUpMultipartFormDataParsing(): Router {
  const router = Router({ mergeParams: true })
  const maxUploadSize = 10 * 10000 // 100kb
  const upload = multer({ dest: 'uploads/', limits: { fileSize: maxUploadSize } })

  router.use(upload.single('file'))
  router.use(uploadedFileTooLargeHandler)

  return router
}

const uploadedFileTooLargeHandler: ErrorRequestHandler = (err: Error, req, res, next): void => {
  if (!(err instanceof MulterError) && (err as MulterError).code !== 'LIMIT_FILE_SIZE') return next(err)

  req.flash(
    'validationErrors',
    JSON.stringify([{ field: 'file', message: 'The selected file must be smaller than 100kb' }]),
  )
  req.flash('formResponses', JSON.stringify(req.body))

  return res.redirect('back')
}
