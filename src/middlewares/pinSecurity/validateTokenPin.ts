import { Request, Response, NextFunction } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { checkTokenPin } from '../../utils'
import { errors } from '../../types'
export const checkTokenPinValidation = async (
  req: Request | any,
  res: Response,
  next: NextFunction
) => {
  const { tokenPin } = req.body || {}

  const check = await checkTokenPin(tokenPin)

  if (!check) {
    const error = errors.find((error) => error.key === '010')
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: ReasonPhrases.BAD_REQUEST,
      description: error.code
    })
  }

  return next()
}
