import express from 'express'
import dotenv from 'dotenv'
import https from 'https'
import fs from 'fs'

import { startDB } from './db/Database'
import authRoute from './endpoints/authentication/authRoute'
import userRoute from './endpoints/user/userRoute'
import userRouteStrict from './endpoints/user/userRouteStrict'
import degreeRoute from './endpoints/degreeCourses/degreeRoute'
import degreeApplicationsRoute from './endpoints/applications/degreeApplicationsRoute'
import cors from 'cors'

dotenv.config()

const privateKey = fs.readFileSync('./certificates/key.pem')
const certificate = fs.readFileSync('./certificates/cert.pem')

const app: express.Express = express()
const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app)

const port = process.env.PORT
const securePort = process.env.SECURE_PORT

if (process.env.TESTING === 'true') {
    console.log('Testing mode.')
} else {
    console.log('Production mode.')
    startDB(process.env.DATABASE_URL as string)
}

app.use('*', cors({
    exposedHeaders: ['*'],
}))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Expose-Headers","Authorization");
    next();
});

app.use(express.json())

app.use('/api/publicUsers', userRoute)

app.use('/api/users', userRouteStrict)

app.use('/api/authenticate', authRoute)

app.use('/api/degreeCourses', degreeRoute)

app.use('/api/degreeCourseApplications', degreeApplicationsRoute)

const httpServer = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

httpsServer.listen(securePort, () => {
    console.log(`Example app listening at http://localhost:${securePort}`)
})

export function closeServers(): void {
    httpsServer.close()
    httpServer.close()
}

export default app