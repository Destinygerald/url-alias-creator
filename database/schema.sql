-- DROP DATABASE url_briefer;

CREATE DATABASE url_briefer;
USE url_briefer;

CREATE TABLE user (
	id INT NOT NULL AUTO_INCREMENT,
	email VARCHAR(255) NOT NULL,
	password VARCHAR(255) NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE url (
	id INT NOT NULL AUTO_INCREMENT,
	original_url VARCHAR(255) NOT NULL,
	shortened_url VARCHAR(255) NOT NULL,
	owner INT,
 	PRIMARY KEY (id),
 	FOREIGN KEY (owner) REFERENCES user(id)
);