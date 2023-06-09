import express from 'express'
import dotenv from 'dotenv'

import * as courseServices from './degreeService'
import * as applicationServices from '../applications/degreeApplicationService'
import { isAuthorized, isAdmin, cleanCourse } from '../utils'

const router = express.Router()

dotenv.config()

// Getting all
router.get('/', isAuthorized, async (req: express.Request, res: any) => {
    console.log('getting all')
    if (Object.values(req.query).length > 0) {
        try {
            const courses = await courseServices.getManyCourses(req.query)
            if (!courses) return res.status(500).json({ Error: 'Something went wrong.' })
            if (courses.length > 0) {
                return res.status(200).json(cleanCourse(courses as Record<string, any>))
            } else {
                return res.status(404).json({ Error: 'Nothing found.' })
            }
        } catch(error: any) {
            return res.status(500).json({ Error: error })
        }
    }
    try {
        const courses = await courseServices.getAllCourses()
        res.status(200).json(cleanCourse(courses))
    } catch (error: any) {
        res.status(500).json({ Error: error })
    }
})

router.get('/:id/:degreeCourseApplications', async (req: express.Request, res: any)  => {
    console.log('Getting applications for course.')
    try {
        const applications = await applicationServices.getManyApplications({ degreeCourseID: req.params.id })
        res.status(200).json(applications)
    } catch (error) {
        res.status(500).json({ Error: error })
    }
})

// Getting one
router.get('/:id', isAuthorized, async (req: express.Request, res: any) => {
    console.log('getting one')
    try {
        const course = await courseServices.getOneCourse(req.params.id)
        if (course) {
            res.status(200).json(cleanCourse(course))
        } else {
            res.status(404).json({ Error: 'Course not found' })
        }
    } catch (error:any) {
        res.status(500).json({ Error: error })
    }
})

// Creating one
router.post('/', isAuthorized, isAdmin, async (req: express.Request, res: any) => {
    console.log('creating one')
    try {
        const course = await courseServices.postOneCourse(req.body)
        res.status(201).json(cleanCourse(course))
    } catch(error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Duplicate ID not allowed.' })
        } else if (error.name === "ValidationError") {
            res.status(400).json({ message: 'Required property missing.' }) 
        } else {
            res.status(500).json({ Error: error })
        }
    }
})

// Updating one
router.put('/:id', isAuthorized, isAdmin, async (req: express.Request, res: any) => {
    console.log('updating one')
    if (req.body.id) return res.status(400).json({ Error: 'Changing course ID not allowed.' })

    try {
        const updatedCourse = await courseServices.updateOneCourse(req.params.id, req.body)
        if (updatedCourse) {
            res.status(200).json(cleanCourse(updatedCourse))
        } else {
            res.status(404).json({ message: 'Course not found' })
        }
    } catch (error: any) {
        res.status(500).json({ message: error })
    }
})

// Deleting one
router.delete('/:id', isAuthorized, isAdmin, async (req: express.Request, res: any) => {
    console.log('deleting one')
    try {
        const deleted = await courseServices.deleteOneCourse(req.params.id)
        if (deleted.deletedCount > 0) {
            res.sendStatus(204)
        } else {
            res.status(404).json(`Course ${req.params.id} not found.`)
        }
    } catch(error: any) {
        res.status(500).json({ Error: error })
    }
})

export default router