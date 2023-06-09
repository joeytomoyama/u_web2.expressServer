import express from 'express'
import * as Services from './userService'

const router = express.Router()

// Getting all
router.get('/', async (req: express.Request, res: express.Response) => {
    try {
        const users = await Services.getAllUsers()
        res.status(200).json(users)
    } catch (error: any) {
        res.status(500).json({ Error: error })
    }
})

// Getting one
router.get('/:userID', async (req: express.Request, res: express.Response) => {
    try {
        const user = await Services.getOneUser(req.params.userID)
        user ? res.status(200).json(user) : res.status(404).json({ Error: 'User not found' })
    } catch (error: any) {
        res.status(500).json({ Error: error })
    }
})

// Creating one
router.post('/', async (req: express.Request, res: express.Response) => {
    try {
        const user = await Services.postOneUser(req.body)
        res.status(201).json(user)
    } catch(error: any) {
        if (error.code === 11000) {
            res.status(400).json({ Error: 'Duplicate ID not allowed.' })
        } else if (error.name === "ValidationError") {
            res.status(400).json({ Error: 'Required property missing.' }) 
        } else {
            res.status(500).json({ Error: error })
        }
    }
})

// Updating one
router.put('/:userID', async (req: express.Request, res: express.Response) => {
    try {
        const updatedUser = await Services.updateOneUser(req.params.userID, req.body)
        if (updatedUser) {
            res.status(200).json(updatedUser)
        } else {
            res.status(404).json({ Error: 'User not found' })
        }
    } catch (error: any) {
        res.status(500).json({ Error: error })
    }
})

// Deleting one
router.delete('/:userID', async (req: express.Request, res: express.Response) => {
    try {
        const test = await Services.deleteOneUser(req.params.userID)
        if (test.deletedCount > 0) {
            res.sendStatus(204)
        } else {
            res.status(404).json(`User ${req.params.userID} not found.`)
        }
    } catch(error: any) {
        res.status(500).json({ Error: error })
    }
})

export default router