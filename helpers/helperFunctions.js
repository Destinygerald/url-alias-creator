const bcrypt = require('bcrypt')
const { db } = require('../database/query.js') 

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

async function createDatabase () {
	try {
		await db.query(`DROP DATABASE url_briefer;`)
		await db.query(`CREATE DATABASE url_briefer;`)
		await db.query(`USE url_briefer;`)

		await db.query(`
			CREATE TABLE user (
				id INT NOT NULL AUTO_INCREMENT,
				email VARCHAR(255) NOT NULL,
				password VARCHAR(255) NOT NULL,
				PRIMARY KEY (id)
			);
		`)

		await db.query(`
			CREATE TABLE url (
				id INT NOT NULL AUTO_INCREMENT,
				original_url VARCHAR(255) NOT NULL,
				shortened_url VARCHAR(255) NOT NULL,
				owner INT,
			 	PRIMARY KEY (id),
			 	FOREIGN KEY (owner) REFERENCES user(id)
			);
		`)



	} catch (err) {
		console.log('Failed to connect database ', err)
		return;
	}
}

module.exports = { hashPassword, comparePassword, urlIsValid, createDatabase }