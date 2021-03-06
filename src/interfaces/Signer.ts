export interface Signer {
  _id: string
  userId: string
  fullName?: string
  email: string
  type: string
  signed?: boolean
  dateSigned?: Date
  rol?: string
  cuit?: string
}
