import { Request, Response } from 'express'
import { ResponseOkProps } from '../interfaces/SatelliteImageRequest'
import { addSatelliteImageInActivity } from '../utils'
import { validateResponseSatelliteImages } from '../utils/Validation'

class WebHookController {
  /**
   * Callback Sensing Satellite Images Lot.
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async sensingSatelliteCallback(
    req: Request,
    res: Response
  ): Promise<void> {
    const content: Array<ResponseOkProps> = req.body

    await validateResponseSatelliteImages(content)

    await addSatelliteImageInActivity(content)

    res.status(200).json('Ok')
  }
}
export default new WebHookController()
