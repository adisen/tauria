import mongoose, { Schema } from 'mongoose'

export interface IRoom extends mongoose.Document {
  name: string
  host: string
  participants: string[]
  capacity: number
}

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  participants: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      }
    }
  ],
  capacity: {
    type: Number,
    default: 5
  }
})

const Room = mongoose.model<IRoom>('room', RoomSchema)
export default Room
