import express, { Request, Response } from 'express'
const router = express.Router()
const auth = require('../middleware/auth')

import User, { IUser } from '../models/User'
import Room, { IRoom } from '../models/Room'
import { exists } from 'fs'

// @route   GET api/rooms
// @desc    Get all rooms
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find()
    res.send(rooms)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route   GET api/rooms/:id
// @desc    Get single room by id
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const room = await Room.findById(id)
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' })
    }

    res.json(room)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route   POST api/rooms/create
// @desc    Create a room
// @access  Private
router.post('/create', auth, async (req: Request, res: Response) => {
  const { id } = req.user
  const { name, capacity }: IRoom = req.body
  try {
    const user = await User.findById(id)

    const newRoom = new Room({
      name,
      capacity,
      host: id,
      participants: [{ user: id }]
    })

    const room = await newRoom.save()
    user?.rooms.push({ room: room.id })
    user?.save()
    res.send(room)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route   GET api/rooms/all/:username
// @desc    Get a rooms that a user is by username
// @access  Public
router.get('/all/:username', async (req, res) => {
  const { username } = req.params
  try {
    const user = await User.findOne({ username: username })
    if (!user) {
      return res.status(400).json({ msg: 'User does not exists' })
    }

    res.json(user.rooms)
  } catch (error) {}
})

// @route   PUT api/rooms/join
// @desc    Join room
// @access  Private
router.put('/join', auth, async (req: Request, res: Response) => {
  const { id } = req.user
  const { roomId } = req.body

  try {
    // Find room
    const room = await Room.findById(roomId)
    const user = await User.findById(id)
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' })
    }

    const found = room.participants.find(user => user.user == id)
    if (found) {
      return res.json({ msg: 'User already joined' })
    }

    // Check if room capacity is exceeded
    if (room?.capacity === room?.participants.length) {
      return res.status(400).json({ msg: "Room full, you can't join" })
    }

    // If not, join room
    room?.participants.push({ user: id })
    user?.rooms.push({ room: roomId })
    // Save to db
    await room?.save()
    await user?.save()
    res.send(room)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route   PUT api/rooms/leave
// @desc    Leave room
// @access  Private
router.put('/leave', auth, async (req: Request, res: Response) => {
  const { id } = req.user
  const { roomId } = req.body

  try {
    // Find room
    const room = await Room.findById(roomId)
    const user = await User.findById(id)
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' })
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' })
    }

    // Check if user is in room already
    const found = room.participants.find(user => user.user == id)
    if (!found) {
      return res.json({ msg: 'User not in room' })
    }

    // If not, leave room
    room.participants = room?.participants.filter(user => user.user != id)
    user.rooms = user?.rooms.filter(room => room.room != roomId)
    // Save to db
    await room?.save()
    res.json(room)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route   PUT api/rooms/host
// @desc    Change host
// @access  Private
router.put('/leave', auth, async (req: Request, res: Response) => {
  const { id } = req.user
  const { roomId, newHost } = req.body

  try {
    // Find room
    let room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' })
    }

    // Check if user is in room already
    const found = room.participants.find(user => user.user == id)
    if (!found) {
      return res.json({ msg: 'User not in room' })
    }

    // Check if user is the host
    if (room.host != id) {
      return res.status(400).json({ msg: 'User is not the current host' })
    }

    // Check if newhost exists
    const newHostUser = await User.findOne({ username: newHost })
    if (!newHostUser) {
      return res.status(400).json({ msg: 'New host not a valid user' })
    }

    room.host = newHostUser.id

    // Save to db
    await room?.save()
    res.json(room)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

module.exports = router
