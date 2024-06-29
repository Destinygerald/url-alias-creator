const { db } = require('../database/query.js')
const { hashPassword, comparePassword, urlIsValid } = require('../helpers/helperFunctions.js')
const jwt = require('jsonwebtoken')
const short = require('short-uuid')

require('dotenv').config()

async function getUser(req, res) {
	try {

		const { email } = req.query

		const [ rows ] = await db.query(`
			SELECT * FROM user WHERE email=?
		`, [email])

		if ( !rows[0] ) {
			return res.status(404).json({
				message: 'No user with such email'
			})
		}


		return res.status(200).json({
			data: rows[0]
		})
	
	} catch (err) {
		return res.status(500).json({
			message: err.message
		})
	}
}


async function addUser(req, res) {
	try {

		const { email, password } = req.body

		if (!email || !password) {
			return res.status(400).json({
				message: "Expects an email and password"
			})
		}

		const [ user ] = await db.query(`
			SELECT * FROM user WHERE email=?
		`, [email])

		if (user[0]) {
			return res.status(409).json({
				message: 'Email already exists'
			})
		}

		const hashedPassword = await hashPassword(password)

		const result = await db.query(`
			INSERT INTO user (email, password)
			VALUES (?, ?)
		`, [email, hashedPassword])

		return res.status(201).json({
			message: 'New user created'
		})


	} catch (err) {
		return res.status(500).json({
			message: err.message
		})
	}
}


async function login (req, res) {
	try {

		const { email, password } = req.body

		const [ user ] = await db.query(`
			SELECT * FROM user WHERE email=?
		`, [email])

		if (!user[0]) {
			return res.status(401).json({
				message: "Invalid credentials"
			})
		}

		const checkPassword = await comparePassword(password, user[0].password)

		if (!checkPassword) {
			return res.status(401).json({
				message: "Invalid credentials"
			})
		}

		const token = await jwt.sign(user[0], process.env.SECRET)

		if (!token) {
			return res.status(500).json({
				message: "Failed in token generation"
			})
		}

		res.cookie('token', token, { expires: new Date( parseInt(Date.now()) +  60 * 60 * 24) }).status(200).json({
			message: 'Login Successful'
		})


	} catch (err) {
		return res.status(500).json({
			message: err.message
		})
	}
}



async function createUrlAlias (req, res) {
	try {

		const { url, alias } = req.body
		const { token } = req.cookies

		if ( !urlIsValid(url) ) {
			return res.status(403).json({
				message: "Invalid URL format, use http://... or https://... "
			})
		}

		
		const autoId =  short(short.constants.uuid25Base36, {consistentLength: false})

		await jwt.verify(token, process.env.SECRET, {}, async(err, user) => {

			if (err) throw err;

			const [ checkUser ] = await db.query(`
				SELECT * FROM user WHERE email=?
			`, [user.email])

			if (!checkUser[0]) {
				return res.status(401).json({
					message: 'Invalid login, try again'
				})
			}

			if (!url) {
				return res.status(204).json({
					message: "No Content"
				})
			}

			if (!alias) {

				let autoAlias = autoId.generate()
				let autoAliasExist = true;

				while (autoAliasExist) {

					const [ result ] = await db.query(`
						SELECT * FROM url WHERE shortened_url=? 
					`, [autoAlias])

					if (result[0]) {
						autoAlias = autoId.generate()
					} else {
						autoAliasExist = false
					}
				}

				const newUrl = await db.query(`
					INSERT INTO url (original_url, shortened_url, owner)
					VALUES(?, ?, ?)
				`, [url, autoAlias, user?.id])

				return res.status(201).json({
					data: {
						original_url: url,
						shortened_url: autoAlias,
						owner: user?.email
					}
				})

			}

			const [ result ] = await db.query(`
				SELECT * FROM url WHERE shortened_url=? 
			`, [alias])

			if ( alias == "user" || alias == 'login' || alias == "create-url-alias" ) {
				return res.status(401).json({
					status: 'Failed',
					message: "Can't use already taken urls"
				})
			}

			if (result[0]) {
				return res.status(401).json({
					message: 'Url Alias already exists'
				})
			}

			const newUrl = await db.query(`
				INSERT INTO url (original_url, shortened_url, owner)
				VALUES (?, ?, ?)
			`, [ url, alias, user?.id ])

			if (!newUrl) {
				return res.status(500).json({
					message: 'Process Failed'
				})
			}

			return res.status(201).json({
				data: {
						original_url: url,
						shortened_url: alias,
						owner: user?.email
					}
			})
		})

	} catch (err) {
		return res.status(500).json({
			message: err.message
		})
	}
}


async function urlAlias (req, res) {
	try {

		const { id } = req.params;

		const [ result ]  = await db.query(`
			SELECT DISTINCT * FROM url WHERE shortened_url=? LIMIT 1
		`, [id])

		if ( !result[0] ) {
			return res.status(404).json({
				message: "Not found"
			})
		}

		return res.status(301).redirect(result[0]?.original_url);

	} catch (err) {
		return res.status(500).json({
			message: err.message
		})
	}
}


async function getMyUrlList(req, res) {
	try {

		const { token } = req.cookies;

		await jwt.verify(token, process.env.SECRET, {}, async(err, user) => {
			
			if (err) throw err;


			const [ result ] = await db.query(`
				SELECT * FROM user WHERE email=?
			`, [user.email])

			console.log(result)

			if (!result[0]) {
				return res.status(401).json({
					message: "Invalid credentials"
				})
			}

			const [ urls ] = await db.query(`
				SELECT * FROM url WHERE owner=?
			`, [ result[0].id ])

			return res.status(200).json({
				data: urls
			})

		})


			
	} catch (err) {
		return res.status(500).json({
			message: err.message,
		})
	}
}

module.exports = { addUser, getUser, login, createUrlAlias, urlAlias, getMyUrlList }