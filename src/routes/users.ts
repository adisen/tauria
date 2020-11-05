import express, { Request, Response } from 'express'
const router = express.Router()

import { check, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import User, { IUser } from '../models/User'
// import auth from '../middleware/auth'
const auth = require('../middleware/auth')

// @route   GET api/users/
// @desc    Get all users
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password')
    res.send(users)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// @route   GET api/users/:username
// @desc    Returns a user by username
// @access  Public
router.get('/:username', async (req: Request, res: Response) => {
  const { username } = req.params
  try {
    const user = await User.findOne({ username: username }).select('-password')
    if (!user) {
      res.status(400).send('User does not exist')
    }

    res.send(user)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// @route   DELETE api/users/
// @desc    Delete current user
// @access  Private
router.delete('/', auth, async (req: Request, res: Response) => {
  const { id } = req.user
  try {
    await User.deleteOne({ _id: id })
    res.send('User Deleted')
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// @route   PATCH api/users/
// @desc    Update current user
// @access  Private
router.patch('/', auth, async (req: Request, res: Response) => {
  const { id } = req.user
  const { username, mobile_token }: IUser = req.body

  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10)
      const password = await bcrypt.hash(req.body.password, salt)
    }

    await User.update({ _id: id }, { username, mobile_token, password })
    res.send('User updated')
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// @route   POST api/users/signup
// @desc    Register user
// @access  Public
router.post(
  '/signup',
  [
    check('username', 'Username is required').notEmpty(),
    check(
      'password',
      'Please enter a password with minimum of 6 characters'
    ).isLength({ min: 6 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password, mobile_token }: IUser = req.body

    try {
      // See if user exists
      let user = await User.findOne({ username })
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] })
      }

      user = new User({
        username,
        password,
        mobile_token
      })

      // Encrypt password and save to db
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
      await user.save()

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )
    } catch (error) {
      console.error(error.message)
      res.status(500).send('Server error')
    }
  }
)

// @route   POST api/users/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    check('username', 'Username is required').exists(),
    check('password', 'Password is required').exists()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password } = req.body

    try {
      // See if user exists
      let user = await User.findOne({ username })
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] })
      }

      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] })
      }

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )
    } catch (error) {
      console.error(error.message)
      res.status(500).send('Server error')
    }
  }
)

module.exports = router
