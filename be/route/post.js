const { Router } = require('express')

const controller = require('../controller/post')
const { validateBody, schemas } = require('../validation/post')

const auth = require('../middleware/auth')
const authifprovide = require('../middleware/authifprovide')
const mongoidcheck = require('../middleware/mongoidcheck')

const route = Router()

exports.postRoute = (app) => {
    app.use('/post', route)

    route.get('/', controller.index)
    route.get('/withComment', authifprovide, controller.withComment)
    route.get('/self', auth(), controller.myPost)
    route.post('/', auth(), validateBody(schemas.create), controller.create)
    route.get('/restore/:id', auth(), mongoidcheck, controller.restore)
    route.get('/upvote/:id', auth(), mongoidcheck, controller.upvote)
    route.get('/downvote/:id', auth(), mongoidcheck, controller.downvote)
    route.get('/novote/:id', auth(), mongoidcheck, controller.novote)
    route.get('/:id', mongoidcheck, controller.post)
    route.put('/:id', auth('admin'), mongoidcheck, validateBody(schemas.create), controller.update)
    route.delete('/:id', auth('admin'), controller.delete)
}