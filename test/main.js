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
	cnfFile     = './d/cnf.json',

	odb         = require('oriento'),
	u2j         = require('../index.js')

;
global.CNF=false;
global.SRV=false;

describe('u2j Suit',function(){

	describe('Parsing test file',function(){

		it('Test tst.atf.puml file should be generated',function(){
			expect(fs.existsSync(tstSrcFile)).to.be.true;
		});

	});

	describe('Req. 0.1. Converting PlantUML to import.json',function(){

		describe('Checking files',function(){

			it('Schema file is present',function(){
				expect(fs.existsSync(schemaFile)).to.be.true;
			});

			it('Compiler should find initial OrientDB data',function(){
				expect(fs.existsSync(initialOD)).to.be.true;
			});

		});

		describe('Compiling Import JSON',function(){

			before(function(){

				fs.emptyDirSync(tmp);

				u2j.compileImportJSON(tstSrcFile,tstFile);

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

	});

	describe('Req. 0.2. Generate schema online',function(){

		before('Loading config',function(){

			global.CNF=JSON.parse(fs.readFileSync(cnfFile,'utf8'));

		});

		describe('Checking files',function(){

			it('cnf.json should exist',function(){
				expect(fs.existsSync(cnfFile)).to.be.true;
			});

			it('Config should be loaded',function(){
				expect(CNF).to.be.an('object');
			});

		});

		describe('Req. 0.2.2. Connecting to local OrientDB server',function(){

			global.SRV=odb(JSON.parse(fs.readFileSync(cnfFile,'utf8')).server);

			it('Server should be initialized',function(){
				expect(SRV).to.be.an('object');
			});

			it('Test database should be created',function(){

				var dbname='tmpTstDb';
				SRV.create({
					name: dbname,
					type: 'graph',
					storage: 'memory'

				}).then(function(db){
					expect(db.name).to.equal(dbname);
				});

			});

		});

		describe('Req. 0.2.3. Generating classes',function(){

			it('There should be 12 classes in test db',function(){
				expect(0).to.be.equal(10);
			});

		});

		describe('3 Compiling test graph',function(){

		});

	});

});
