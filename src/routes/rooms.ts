import express, { Request, Response } from 'express'
const router = express.Router()

import User, { IUser } from '../models/User'
import Rooms, { IRoom } from '../models/Room'

// @route   POST api/users
// @desc    Register user
// @access  Public

module.exports = router
