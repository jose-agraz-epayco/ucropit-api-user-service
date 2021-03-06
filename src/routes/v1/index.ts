import express, { Response, Request } from 'express'
import 'express-async-errors'

import users from './users'
import profile from './profile'
import auth from './auth'
import lots from './lots'
import crop from './crop'
import cropCollaborators from './cropCollaborators'
import activities from './activities'
import company from './company'
import common from './common'
import configs from './configs'
import passport from '../../utils/auth/strategies/jwt'
import achievements from './achievements'
import collaborators from './collaborators'
import reports from './reports'
import charts from './charts'
import badges from './badges'
import countries from './countries'
import licenses from './licenses'
import files from './files'
import supplies from './supplies'
import offline from './offline'
import integrations from './integrations'
import webhooks from './webhooks'

const router: express.Router = express.Router()

router.get('/', (req: Request, res: Response) => {
  res.send(req.__('api_v1_ready'))
})

router.get('/ping', (req: Request, res: Response) => {
  res.send('pong')
})

const authMiddleware = passport.authenticate('jwt', { session: false })

router.get('/fast-links', (req, res: Response) => {
  res.render('fast-links', { url: process.env.SCHEMA_URL })
})

router.get('/ping', (req: Request, res: Response) => {
  res.send('pong')
})

// AUTH
router.use('/auth', auth)

// USERS
router.use('/users', authMiddleware, users)

// PROFILE
router.use('/profile', authMiddleware, profile)

// LOTS
router.use('/lots', authMiddleware, lots)

// COMMON
router.use('/commons', authMiddleware, common)

// CROPS
router.use('/crops', authMiddleware, crop)

// CROPS
router.use('/crops', authMiddleware, cropCollaborators)

// ACTIVITIES
router.use('/activities', authMiddleware, activities)

// COMPANIES
router.use('/companies', authMiddleware, company)

// CONFIGURATIONS
router.use('/configurations', authMiddleware, configs)

// ACHIEVEMENTS
router.use('/achievements', authMiddleware, achievements)

// COLLABORATOR
router.use('/collaborators', authMiddleware, collaborators)

// CHARTS CROPS
router.use('/charts', authMiddleware, charts)

// BADGES
router.use('/badges', authMiddleware, badges)

// COUNTRIES
router.use('/countries', authMiddleware, countries)

// LICENSES
router.use('/licenses', authMiddleware, licenses)

// REPORTS
router.use('/reports', reports)

// FILE DOCUMENTS
router.use('/files', files)

// SUPPLIES
router.use('/supplies', supplies)

// OFFLINE
router.use('/offline', authMiddleware, offline)

// API EXPORTER
router.use('/exporters', authMiddleware, integrations)

// WEBHOOKS SERVICES
router.use('/webhooks', webhooks)

export default router
