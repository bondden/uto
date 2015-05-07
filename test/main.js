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

	odb               = require('oriento'),

	imp               = require('../lib/importer.js').importParsedData,
	u2j               = require('../index.js')

;
global.CNF          = false;
global.SRV          = false;
global.DB           = false;

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

		var testData={};

		before('Loading test data',function(done){

			global.CNF=JSON.parse(fs.readFileSync(cnfFile,'utf8'));
			done();

		});

		describe('Checking files',function(){

			it('cnf.json should exist',function(){
				expect(fs.existsSync(cnfFile)).to.be.true;
			});

			it('Config should be loaded',function(){
				expect(CNF).to.be.an('object');
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

			this.timeout(5000);

			var
				parsedData={},
				steps={
					'nClassesBeforeImport':0,
					'nClassesToImport':8,
					'nClassesAfterImport':0
				}
				;

			before(function(done){

				fs.readFile(tstParsedDataFile, function(e, data){
					if(e){
						throw e
					}

					parsedData=JSON.parse(data);

					done();

					/*steps={
						'nClassesBeforeImport':0,
						'nClassesToImport':parsedData.classes.length,
						'nClassesAfterImport':0
					};*/

					/*DB.class.list().then(function(r){
						steps.nClassesBeforeImport=r.length;
						done();
					}).error(function(e){
						done(e);
					});*/

				});

			});

			it('Values of classes to import must be a number',function(done){

				expect(steps.nClassesToImport).to.be.a('number');
				done();

			});

			it('It should create '+steps.nClassesToImport+' classes in test db',function(done){

				//var nClassesImported=0;

				imp(CNF,parsedData,function(n){
					expect(n).to.be.equal(steps.nClassesToImport);
					console.log(n);
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
