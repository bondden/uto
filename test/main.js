/* *
 * Author: Denis Bondarenko <bond.den@gmail.com>
 * Created: 26.03.2015 20:26
 */
'use strict';
require('babel/polyfill');

var
	expect   =require('chai').expect,
	fs       =require('fs-extra'),
	validator=require('is-my-json-valid'),
	clc = require('cli-color'),
	oriento  =require('oriento'),

	cnfFile  ='./d/cnf.json',

	Main     =require('../lib/main').Main
;

var app;

describe('UTO Suit',function(){

	describe('The application should be initialized',function(){
		this.timeout(5000);

		it('It should load Main class',function(done){

			try{

				app=new Main();

				expect(app).to.be.an('object');

				console.log('\ntest: app started\n');

				app.initialized.then(function(d){

					expect(d).to.be.true;

					console.log('\ntest: app initialized\n');

					done();

				}).catch(function(e){
					console.log('\ntest: app initialization error\n');
					done(e);
				});

			}catch(e){

				console.log('\ntest: Error 1:');
				console.log(e);
				done(e);

			}

		});

	});

	describe('It should load config',function(){

		it('Config file should exist',function(){
			expect(fs.existsSync(cnfFile)).to.be.true;
		});

		it('Config file should be compiled',function(done){
			expect(app.cnf).to.be.an('object');
			expect(app.cnf.p.cpl.indexOf('$')).to.equal(-1);
			done();
		});

	});

	describe('Checking files',function(){

		it('Schema file is present',function(done){
			expect(fs.existsSync(app.cnf.path.schemaFile)).to.be.true;
			done();
		});

		it('Compiler should find initial OrientDB data',function(done){
			expect(fs.existsSync(app.cnf.path.initialDBFile)).to.be.true;
			done();
		});

		it('Test tst.atf.puml file should exist',function(done){
			expect(fs.existsSync(app.cnf.test.path.src.pumlFile)).to.be.true;
			done();
		});

		it('Test parsedData file should exist',function(done){
			expect(fs.existsSync(app.cnf.test.path.src.parsedDataFile)).to.be.true;
			done();
		});

		//todo check directories' permissions

	});

	describe('Req. 0.1. Converting PlantUML to import.json',function(){

		it('Req. 0.1.1. It should parse *.puml class diagram file and store a temporary data',function(done){
			//this.timeout(5000);

			fs.emptyDir(app.cnf.test.path.tmp,function(e){

				if(e){
					console.log('test: ');
					console.log(e);
					done(e);
				}

				app.compilePumlToJson(
					app.cnf.test.path.src.pumlFile,
					app.cnf.test.path.dst.compiledTmpFile
				).then(function(d){

					expect(d).to.be.an('object');
					expect(d.compiled).to.be.true;
					expect(d.valid).to.be.true;
					expect(d.error).to.be.null;
					expect(d.saved).to.be.true;

					done();

				}).catch(function(e){

					console.log('test: ');
					console.log(e);
					done(e);

				});

			});



		});

		it('Req. 0.1.2. It should save the result to ./tmp/tst.atf.json file',function(done){

			expect(fs.existsSync(app.cnf.test.path.dst.compiledTmpFile)).to.be.true;
			done();

		});

		it('Req. 0.1.3. Resulting file should be well-formed JSON-file',function(done){

			var jRaw=fs.readFileSync(app.cnf.test.path.dst.compiledTmpFile);
			expect(JSON.parse(jRaw)).to.be.an('object');
			done();

		});

		describe('Req. 0.1.4. It should validate resulting file against JSON schema.',function(){

			//todo: create valid and invalid sample schemas for the test

			it('"Compile" should return result.error message "Validation against schema failed" if the file is not valid',function(done){
				//expect(false).to.be.true;
				done();
			});

			it('"Compile" should return result.valid=true if the file is valid',function(done){
				//expect(false).to.be.true;
				done();
			});

		});

	});

	describe('Req. 0.2. It should create DB schema classes from temporary parsed data',function(){

		//before(function(){});

		describe('Req. 0.2.1. It should connect to server',function(){

			it('DB Client "Server" should be initialized',function(done){
				expect(app.odbSrv).to.be.an('object');
				done();
			});

		});

		describe('Req. 0.2.2. It should detect if the database exists and, if yes, then use it, if no, then create it',function(){

			it('db should be an object',function(done){
				expect(app.db).to.be.an('object');
				done();
			});

		});

		describe('Req. 0.2.3. It should create classes, that do not exist',function(){
			this.timeout(40000);

			var srv,db,existentClasses=[],newClasses=[],absentClasses=[];
			before(function(done){

				app.parsedData.classes.forEach(function(c){
					newClasses.push(c.name);
				});

				//absentClasses=newClasses.slice();

				srv=oriento({
					host     :'localhost',
					port     :2424,
					username :app.cnf.orient.server.username,
					password :app.cnf.orient.server.password
				});

				db=srv.use({
					name     :app.cnf.orient.db.name,
					username :app.cnf.orient.db.username,
					password :app.cnf.orient.db.password
				});

				db.class.list().then(function(classes){

					classes.forEach(function(c){
						existentClasses.push(c.name);
						if(!newClasses.includes(c.name)){
							absentClasses.push(c.name);
						}
					});

					done();
				}).catch(function(e){
					done(e);
				});

			});

			it('It should throw an Error on non-existent file',function(done){
				try{
					app.importPuml('abc').then(function(d){
						expect(false).to.be.true;
						done();
					}).catch(function(e){
						done();
					});
				}catch(e){
					done();
				}
			});

			var nClassesBefore=existentClasses.length,
			    nClassesToAdd=absentClasses.length;
			it('Absent classes should be added',function(done){

				app.importPuml(app.cnf.test.path.src.pumlFile).then(function(d){

					console.log('test: ');
					console.log(d);

					db.class.list().then(function(rc){

						var nClassesAfter=nClassesBefore+nClassesToAdd;
						expect(rc.length).to.equal(nClassesAfter);

						done();
					}).catch(function(e){
						done(e);
					});

				}).catch(function(e){
					done(e);
				});

			});

		});

	});

	describe('Req. 0.3. There should be a web-interface',function(){

		describe('Express server should be on',function(){

			it('Express Server should be initialized',function(done){
				expect(app.server.x).to.be.an('object');
				done();
			});

			it('Express Server should listen port 80',function(done){

				console.log('openinig http://localhost:80...');

				var page = require('webpage').create();

				page.open('http://localhost:80', function(s){
					console.log(s);
					phantom.exit();
					done();
				});

			});

		});

		describe('Req. 0.3.1. It should have as minimum two-column layout, where left column is for PlamtUML code textarea, right column - for rendered image.',function(){

			it('Web-interface url should be accessible',function(){

			});

		});

		describe('Req. 0.3.2. The rendered image should be updated on the code in textarea changes. To render image it should use remote service from the official PlantUML site example.',function(){

			//use Selenium or Phantom

			it('There should be a textarea',function(){

			});

			it('Should render an image after editing code in texterea',function(){

			});

			it('The resulting image should be visually equal to the sample',function(){

			});

		});

	});

	describe('Req. 0.4. It should use own renderer',function(){

		describe('Req. 0.4.1. Dot renderer binaries should be installed on owned sever',function(){

			it('dot.exe should be reachable at the path or PATH',function(){

			});

			it('The app should have rights to run dot.exe',function(){

			});

		});

		describe('Req. 0.4.2. Web-interface should refer to owned server',function(){

			//use traffic capture

			it('Requests from web-interface should lead to it\'s host',function(){

			});

		});

	});

	describe('Req. 0.5. It should generate PlantUML code from OrientDB database schema',function(){

		describe('Req. 0.5.1. It should save it to a file, available for download from web-interface',function(){

			it('The generated file should exist',function(){

			});

			it('Reachable url to the file from the web-interface should exist',function(){

			});

		});

		describe('Req. 0.5.2. It should render the generated file to image, available for download from web-interface',function(){

			it('The image should exist',function(){

			});

			it('The image should look like it has no errors',function(){

			});

			it('URL to the image should be accessible',function(){

			});

		});

	});

	describe('Req. 1.0. There should be a documentation and a web-page',function(){

		describe('Req. 1.0.1. There should be a web-page for the project',function(){

		});

		describe('Req. 1.0.2. It should contain the web-interface (req. 0.3.)',function(){

		});

		describe('Req. 1.0.3. There should be a descriptive documentation for the project',function(){

		});

	});

	describe('Req. 2.0. It should support import of ESF requirements diagrams to OrientDB',function(){

	});

});
