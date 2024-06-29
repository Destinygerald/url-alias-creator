const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const { db } = require('./database/query.js')
const { createDatabase } = require('./helpers/helperFunctions.js')
const { addUser, getUser, login, urlAlias , createUrlAlias, getMyUrlList } = require('./controllers/controllers.js')
require('dotenv').config()

const app = express()

const PORT = process.env.PORT || 8000

// Middlewares
app.use(express.json())
app.use(cors({
	origin: '*',
	credentials: true	
}))

app.use((err, res, req, next) => {
	console.error(err.stack)
	return res.status(500).send('Something broke')
})


app.post('/user', addUser)
app.get('/user', getUser)
app.post('/login', login)
app.post('/create-url-alias', createUrlAlias)

app.post('/:id', urlAlias)

app.get('/my-urls', getMyUrlList)


createDatabase()


app.listen(PORT, () => {
	console.log(`Server running on Port ${PORT}`)
})