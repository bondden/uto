/* *
 * Author: Denis Bondarenko <bond.den@gmail.com>
 * Created: 26.03.2015 20:26
 */

'use strict';

var
	expect            = require('chai').expect,
	fs                = require('fs-extra'),
	validator         = require('is-my-json-valid'),

	tmp               = './test/.tmp/',
	tstFile           = tmp+'tst.atf.json',
	tstSrcFile        = './test/class.puml/sample.0.1.atf.puml',
	schemaFile        = './d/odb.schema.json',
	initialOD         = './d/init.odb.json',
	cnfFile           = './d/cnf.json',
	tstParsedDataFile = './test/d/parsedData.json',

	//odb               = require('oriento'),

	imp               = require('../lib/importer.js').importParsedData,
	u2j               = require('../index.js')

;
global.CNF          = false;
global.SRV          = false;
global.DB           = false;

describe('u2j Suit',function(){

	describe('Parsing test file',function(){

		it('Test tst.atf.puml file should exist',function(){
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

		var
			parsedData=false,
		  cnf=false
			;

		before('Loading config and test data',function(done){

			var rec=0;
			var rdy=function(caller){
				[
					'cnf',
					'dat'
				].forEach(function(v,i,a){
					if(v==caller){
						++rec;
						if(rec===a.length){
							rec=0;
							done();
							return;
						}
					}
				});
			};

			fs.readFile(cnfFile, function(e,data){
				if(e){
					rdy('cnf');
					throw e;
				}
				cnf=JSON.parse(data).server;
				rdy('cnf');
			});

			fs.readFile(tstParsedDataFile, function(e,data){
				if(e){
					rdy('dat');
					throw e;
				}
				parsedData=JSON.parse(data);
				rdy('dat');
			});

		});

		describe('Checking initial data',function(){

			it('Config and parsedData should be ready',function(done){
				expect(cnf).to.be.an('object');
				expect(parsedData).to.be.an('object');
				done();
			});

		});

		/*describe('Req. 0.2.2. Connecting to local OrientDB server',function(){

			it('Server should be initialized',function(done){
				global.SRV=odb(JSON.parse(fs.readFileSync(cnfFile,'utf8')).server);
				expect(SRV).to.be.an('object');
				done();
			});

			it('Test database should be created',function(done){

				var dbname='tmpTstDb';
				SRV.drop(dbname).then(function(){

					SRV.create({
						name: dbname,
						type: 'graph',
						storage: 'memory'
					}).then(function(db){

						expect(db.name).to.equal(dbname);
						global.DB=SRV.use(dbname);
						done();

					}).error(function(e){

						console.log(e);
						done(e);
					});

				}).error(function(e){
					console.log(e);
					done(e);
				});

			});

		});*/

		describe('Req. 0.2.3. Generating classes',function(){

			this.timeout(4000);

			var nClassesToImport=0;

			before(function(done){

				nClassesToImport=parsedData.classes.length;
				done();

			});

			it('Number of classes to import must be 8',function(done){

				expect(nClassesToImport).to.be.a('number');
				expect(nClassesToImport).to.be.equal(8);
				done();

			});

			it('It should create 8 classes in test db',function(done){

				imp(cnf,parsedData,function(n){
					console.log('imp callback called');
					console.log(n);
					expect(n.nClassesImported).to.be.a('number');
					expect(n.nClassesImported).to.be.equal(8);
					done();
				});

				/*parsedData.classes.forEach(function(v,i){

					var className=v.name;
					DB.class.create(className).then(function(r){
						if(r.originalName===className){

							nClassesImported++;
							if(i+1==steps.nClassesToImport){
								expect(nClassesImported).to.be.equal(steps.nClassesToImport);
								done();
							}

						}
					}).error(function(e){
						if(i==steps.nClassesToImport){
							done(e);
						}
					});

				});*/

			});

			/*it('There should be '+steps.nClassesToImport+' new classes created in test db',function(done){

				DB.class.list().then(function(r){

					steps.nClassesAfterImport=r.length;
					var delta=steps.nClassesAfterImport-steps.nClassesBeforeImport;

					expect(delta).to.be.equal(steps.nClassesToImport);

					done();

				}).error(function(e){
					done(e);
				});

			});*/

		});

		describe('3 Compiling test graph',function(){

		});

	});

});
