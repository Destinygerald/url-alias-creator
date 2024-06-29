const bcrypt = require('bcrypt')

function hashPassword(password) {
	return new Promise((res, rej) => {
		bcrypt.genSalt(12, (err, salt) => {
			if (err) {
				rej (err)
			};

			bcrypt.hash(password, salt, (err, hash) => {
				if (err) {
					rej(err)
				}
				res(hash)
			})
		})
	})
}

async function comparePassword (password, hash) {
	return bcrypt.compare(password, hash)
}

function urlIsValid (url) {
	try {

		return Boolean( new URL(url) )

	} catch (err) {
		return false;
	}
}

module.exports = { hashPassword, comparePassword, urlIsValid }