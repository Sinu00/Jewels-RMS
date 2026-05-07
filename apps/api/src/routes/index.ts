import { Router } from 'express'
import authRouter from './auth'
import ornamentsRouter from './ornaments'
import customersRouter from './customers'
import rentalsRouter from './rentals'
import paymentsRouter from './payments'
import dashboardRouter from './dashboard'
import settingsRouter from './settings'

const router = Router()

router.use('/auth', authRouter)
router.use('/ornaments', ornamentsRouter)
router.use('/customers', customersRouter)
router.use('/rentals', rentalsRouter)
router.use('/payments', paymentsRouter)
router.use('/dashboard', dashboardRouter)
router.use('/settings', settingsRouter)

export default router
