import mongoose from 'mongoose'
import dotenv from 'dotenv'
import request from 'supertest'

import app, { closeServers } from '../src/httpServer'
import { ensureAdmin } from '../src/db/Database'

dotenv.config()

beforeAll(async () => {
    await mongoose.connect(process.env.DATABASE_TEST_URL as string)
    await mongoose.connection.db.dropDatabase()
    await ensureAdmin()
})

afterAll(async () => {
    await mongoose.connection.db.dropDatabase()
    await mongoose.connection.close()
    closeServers()
})

describe("Admin exists", () => {
    it("should return all products", async () => {
      const res = await request(app).get("/api/publicUsers")
      expect(res.statusCode).toBe(200)
      expect(res.body.length).toBeGreaterThan(0)
    })
})

// applications
describe("Meilenstein 3", () => {
    let adminToken: string
    let manfredToken: string
    let susiToken: string

    let degreeCourseID: string

    let manfredApplicationID: string

    it("admin authentication", async () => {
        // authenticate
        const auth = await request(app)
            .get("/api/authenticate")
            .set('Authorization', `Basic ${Buffer.from('admin:123').toString('base64')}`)
        expect(auth.statusCode).toBe(200)
        adminToken = auth.header.authorization.split(' ')[1]
        expect(adminToken).toBeDefined()
    })

    it("users authentication", async () => {
        // post manfred
        const manfredRes = await request(app)
            .post("/api/users")
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                userID: 'manfred',
                firstName: 'Manfred',
                lastName: 'Müller',
                password: 'asdf'
            })
        expect(manfredRes.statusCode).toBe(201)

        const authManfred = await request(app)
            .get("/api/authenticate")
            .set('Authorization', `Basic ${Buffer.from('manfred:asdf').toString('base64')}`)
        expect(authManfred.statusCode).toBe(200)
        manfredToken = authManfred.header.authorization.split(' ')[1]
        expect(manfredToken).toBeDefined()

        // post susi
        const susiRes = await request(app)
            .post("/api/users")
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                userID: 'susi',
                firstName: 'Susi',
                lastName: 'Sorglos',
                password: 'asdf'
            })

        const authSusi = await request(app)
            .get("/api/authenticate")
            .set('Authorization', `Basic ${Buffer.from('susi:asdf').toString('base64')}`)
        expect(authSusi.statusCode).toBe(200)
        susiToken = authSusi.header.authorization.split(' ')[1]
        expect(susiToken).toBeDefined()

        // check users
        const checkUsers = await request(app).get("/api/users").set('Authorization', `Bearer ${adminToken}`)
        expect(checkUsers.statusCode).toBe(200)
        expect(checkUsers.body[1].userID).toEqual('manfred')
    })

    it("post courses", async () => {
        // post course
        const courseRes = await request(app)
            .post("/api/degreeCourses")
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                universityName: "Beuth Hochschule für Technik Berlin",
                universityShortName: "Beuth HS",
                departmentName: "Informatik und Medien",
                departmentShortName: "FB VI",
                name: "Orchideenzucht Bachelor",
                shortName: "OZ-BA"
            })

        degreeCourseID = courseRes.body.id

        await request(app)
            .post("/api/degreeCourses")
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                universityName: "Beuth Hochschule für Technik Berlin",
                universityShortName: "Beuth HS",
                departmentName: "Informatik und Medien",
                departmentShortName: "FB VI",
                name: "Orchideenzucht Bachelor",
                shortName: "OZ-BA"
            })
        expect(courseRes.statusCode).toBe(201)

        const checkCourses = await request(app)
            .get("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${adminToken}`)
        expect(checkCourses.statusCode).toBe(200)

        const checkCourse = await request(app)
            .get(`/api/degreeCourses/${degreeCourseID}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(checkCourse.statusCode).toBe(200)
    })

    it("check applications", async () => {
        const checkApplications = await request(app)
            .get("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${adminToken}`)
        expect(checkApplications.statusCode).toBe(200)
        expect(checkApplications.body.length).toBe(0)

        const checkManfredApplications = await request(app)
            .get("/api/degreeCourseApplications/myApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
        
        expect(checkManfredApplications.statusCode).toBe(200)
    })

    it("post valid applications", async () => {
        const manfredApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                degreeCourseID: degreeCourseID,
                targetPeriodYear: 2024,
                targetPeriodShortName: "WiSe"
            })
        manfredApplicationID = manfredApplication.body.id

        expect(manfredApplication.statusCode).toBe(201)
        expect(manfredApplication.body.degreeCourseID).toEqual(degreeCourseID)

        const susiApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                applicantUserID: 'susi',
                degreeCourseID: degreeCourseID,
                targetPeriodYear: 2024,
                targetPeriodShortName: "WiSe"
            })
        expect(susiApplication.statusCode).toBe(201)

        const deleteSusi = await request(app)
            .delete(`/api/degreeCourseApplications/${susiApplication.body.id}`)
            .set('Authorization', `Bearer ${susiToken}`)
        expect(deleteSusi.statusCode).toBe(204)

        const checkApplications = await request(app)
            .get("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${adminToken}`)
        expect(checkApplications.statusCode).toBe(200)
        expect(checkApplications.body.length).toBe(1)
    })

    it("post invalid applications", async () => {
        const checkApplications = await request(app)
            .get("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${adminToken}`)
        expect(checkApplications.statusCode).toBe(200)
        expect(checkApplications.body.length).toBe(1)

        const manfredDuplicateApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                degreeCourseID: degreeCourseID,
                targetPeriodYear: 2024,
                targetPeriodShortName: "WiSe"
            })

        expect(manfredDuplicateApplication.statusCode).toBe(400)

        const invalidManfredApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                applicantUserID: 'manfred',
                degreeCourseID: degreeCourseID.replace('1', '2').replace('a', 'b').replace('c', 'd').replace('e', 'f').replace('g', 'h').replace('i', 'j').replace('k', 'l').replace('m', 'n').replace('o', 'p').replace('q', 'r').replace('s', 't').replace('u', 'v').replace('w', 'x').replace('y', 'z'),
                targetPeriodYear: 2024,
                targetPeriodShortName: "WiSe"
            })
        expect(invalidManfredApplication.statusCode).toBe(404)

        const invalidSusiApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                applicantUserID: 'susi',
                degreeCourseID: degreeCourseID,
                targetPeriodYear: 2024,
                targetPeriodShortName: "WiSe"
            })
            console.log('here')
        console.log(invalidSusiApplication.body)
        expect(invalidSusiApplication.statusCode).toBe(403)

        const invalidApplicantApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                applicantUserID: 'unobtanium',
                degreeCourseID: degreeCourseID,
                targetPeriodYear: 2024,
                targetPeriodShortName: "WiSe"
            })
        expect(invalidApplicantApplication.statusCode).toBe(403)

        const missingPropsApplication = await request(app)
            .post("/api/degreeCourseApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                manfredApplicationID: 'manfred',
                targetperiodYear: 2024
            })
        expect(missingPropsApplication.statusCode).toBe(400)
    })

    it("get applications", async () => {
        const checkApplications = await request(app)
            .get("/api/degreeCourseApplications/myApplications")
            .set('Authorization', `Bearer ${manfredToken}`)
        expect(checkApplications.statusCode).toBe(200)
        expect(checkApplications.body.length).toBe(1)

        const checkManfredApplications = await request(app)
            .get("/api/degreeCourseApplications?applicantUserID=manfred")
            .set('Authorization', `Bearer ${adminToken}`)
        expect(checkManfredApplications.statusCode).toBe(200)
        expect(checkManfredApplications.body[0].applicantUserID).toBe('manfred')

        const checkCourseApplications = await request(app)
            .get(`/api/degreeCourseApplications/?degreeCourseID=${degreeCourseID}`)
            .set('Authorization', `Bearer ${adminToken}`)
        expect(checkCourseApplications.statusCode).toBe(200)
        expect(checkCourseApplications.body[0].degreeCourseID).toBe(degreeCourseID)

        const invalidApplications = await request(app)
            .get(`/api/degreeCourseApplications/?degreeCourseID=asifejlsahfw83s89us`)
            .set('Authorization', `Bearer ${adminToken}`)
        expect(invalidApplications.body).toHaveLength(0)
    })

    it("getting applications over degreeCourse endpoint", async () => {
        const getApplications = await request(app)
            .get(`/api/degreeCourses/${degreeCourseID}/degreeCourseApplications`)
            .set('Authorization', `Bearer ${adminToken}`)
        expect(getApplications.statusCode).toBe(200)
        expect(getApplications.body.length).toBe(1)
    })

    it("valid put applications", async () => {
        const putYearAdmin = await request(app)
            .put(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                targetPeriodYear: 2025
            })
        expect(putYearAdmin.statusCode).toBe(200)
        expect(putYearAdmin.body.targetPeriodYear).toBe('2025')

        const putYearManfred = await request(app)
            .put(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                targetPeriodYear: 2026
            })
        expect(putYearManfred.statusCode).toBe(200)
        expect(putYearManfred.body.targetPeriodYear).toBe('2026')
        expect(putYearManfred.body.applicantUserID).toBe('manfred')

        const putYearManfred2 = await request(app)
            .put(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                applicantUserID: 'manfred',
                targetPeriodYear: 2027
            })
        expect(putYearManfred2.statusCode).toBe(200)
        expect(putYearManfred2.body.targetPeriodYear).toBe('2027')
        expect(putYearManfred2.body.applicantUserID).toBe('manfred')
    })

    it("invalid put applications", async () => {
        const wrongApplication = await request(app)
            .put(`/api/degreeCourseApplications/awejf98jfo9af8j3wf98wj3lf`)
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                targetPeriodYear: 2025
            })
        expect(wrongApplication.statusCode).toBe(404)

        const manfredPutSusi = await request(app)
            .put(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                applicantUserID: 'susi',
                targetPeriodYear: 2028
            })
        expect(manfredPutSusi.statusCode).toBe(403)

        const putID = await request(app)
            .put(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${manfredToken}`)
            .send({
                targetPeridYear: 2029,
                _id: 'something'
            })
        expect(putID.statusCode).toBe(403)
    })

    it("invalid delete applications", async () => {
        const deleteNonExistentApplication = await request(app)
            .delete(`/api/degreeCourseApplications/awejf98jfo9af8j3wf98wj3lf`)
            .set('Authorization', `Bearer ${manfredToken}`)
        expect(deleteNonExistentApplication.statusCode).toBe(404)

        const susiDeleteManfred = await request(app)
            .delete(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${susiToken}`)
        expect(susiDeleteManfred.statusCode).toBe(403)
    })

    it("valid delete applications", async () => {
        const deleteManfredApp = await request(app)
            .delete(`/api/degreeCourseApplications/${manfredApplicationID}`)
            .set('Authorization', `Bearer ${manfredToken}`)
        expect(deleteManfredApp.statusCode).toBe(204)
    })

    // test remove user functionality
    it("remove user", async () => {
        const deleteUser = await request(app)
            .delete(`/api/users/manfred`)
            .set('Authorization', `Bearer ${adminToken}`)
        expect(deleteUser.statusCode).toBe(204)
    })
})