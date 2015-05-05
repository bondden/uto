/* *
 * Author: Denis Bondarenko <bond.den@gmail.com>
 * Created: 26.03.2015 20:26
 */

'use strict';

var
	expect      = require('chai').expect,
	should      = require('chai').should(),
	mocha       = require('mocha'),
	fs          = require('fs-extra'),
	validator   = require('is-my-json-valid'),

	tmp         = './test/.tmp/',
	tstFile     = tmp+'tst.atf.json',
	tstSrcFile  = './test/class.puml/sample.0.1.atf.puml',
	schemaFile  = './d/odb.schema.json',
	initialOD   = './d/init.odb.json',

	compiler    = require('../compiler.js'),
	u2j         = require('../index.js')

;

describe('u2j-install',function(){

	before(function(){

		fs.emptyDirSync(tmp);

		u2j.parseFile(tstSrcFile,tstFile);

	});

	describe('Checking files',function(){

		it('Schema file is present',function(){
			expect(fs.existsSync(schemaFile)).to.be.true;
		});

	});

	describe('Parsing test file',function(){

		it('Test tst.atf.puml file should be generated',function(){
			expect(fs.existsSync(tstSrcFile)).to.be.true;
		});

		it('JSON file should exist',function(){
			expect(fs.existsSync(tstFile)).to.be.true;
		});

		it('JSON should be well-formed',function(){
			var jRaw=fs.readFileSync(tstFile);
			expect(JSON.parse(jRaw)).to.be.an('object');
		});

		it('JSON data should be valid against Schema',function(){

			var schemaRaw=fs.readFileSync(schemaFile);
			var schema=JSON.parse(schemaRaw);

			var jRaw=fs.readFileSync(tstFile);
			var json=JSON.parse(jRaw);

			var validate=validator(schema);
			var validationResult=validate(json);

			if(!validationResult){
				console.log(validate.errors);
			}

			expect(validationResult).to.be.true;

		});

	});

	describe('Compiling data',function(){

		it('Compiler should find initial OrientDB data',function(){
			expect(fs.existsSync(initialOD)).to.be.true;
		});

	});

});
