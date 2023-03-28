import { Router } from 'express'
import multer from 'multer'

export default function setUpMultipartFormDataParsing(): Router {
  const router = Router({ mergeParams: true })
  const storage = multer.memoryStorage()
  const maxUploadSize = 10 * 1000 // 10kb
  const upload = multer({ storage, limits: { fileSize: maxUploadSize } })

  router.use(upload.single('file'))

  return router
}
