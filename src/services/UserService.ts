import UserConfigService from './UserConfigService'
import User from '../models/user'

interface IUser {
  firstName: string
  lastName: string
  phone: string
  email: string
  pin?: string
  verifyToken?: string
  companies?: Array<any>
  config: string
}

class UserService {
  public static async store (
    user: IUser,
    configs = { fromInvitation: false, companySelected: '' }
  ) {
    if (!configs.companySelected) {
      delete configs.companySelected
    }

    const config = await UserConfigService.create(configs)

    user.config = config._id

    const newUser = new User(user)

    return newUser.save()
  }

  public static async update (filter, data) {
    return User.findOneAndUpdate(filter, data)
  }
}

export default UserService
