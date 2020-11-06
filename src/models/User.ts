import mongoose, { Schema } from 'mongoose'

export interface IUser extends mongoose.Document {
  username: string
  password: string
  mobile_token: string
  rooms: { room: string }[]
}

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  mobile_token: {
    type: String
  },
  rooms: [
    {
      room: {
        type: Schema.Types.ObjectId,
        ref: 'rooms'
      }
    }
  ]
})

const User = mongoose.model<IUser>('user', UserSchema)
export default User
