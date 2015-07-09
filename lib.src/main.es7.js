/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 16.05.2015.
 */
"use strict";

import * as ServerLib from '../lib/server'
import * as CompilerLib from '../lib/compiler'
import * as ParserLib from '../lib/parser'
import * as ExporterLib from '../lib/exporter'
import * as RendererLib from '../lib/renderer'
import * as ImporterLib from '../lib/importer'
import * as UtilLib from '../lib/util'

var
	Server  =ServerLib.Server,
	Compiler=CompilerLib.Compiler,
	Parser  =ParserLib.Parser,
	Exporter=ExporterLib.Exporter,
	Renderer=RendererLib.Renderer,
	Importer=ImporterLib.Importer
;

var
	fs       =require('fs'),
	path     =require('path'),
	traverse =require('traverse'),
	templater=require('json-templater/string'),
	odb       =require('oriento'),
	L	= UtilLib.Util.log
;

var cplTpl=function(s,root){

	let c=s.replace(/\$\{([a-z0-9\.]+)}/ig,'{{$1}}');
	let r=templater(
		c,
		root
	);

	return r;

};

/**
 * Compiles template strings in json object
 * @param b
 */
var cplBranch=function(b,root){

	traverse(b).forEach(function(v){
		if(typeof v==='string'){
			this.update(cplTpl(v,root));
		}
	});

};

export class Main {

	constructor(){

		var holder=this;

		this.libDir     ='';
		this.modules    =[
			'compiler',
			'importer',
			'exporter',
			'parser',
			'renderer',
			'server'
		];

		this.cnf=false;

		this.server  =false;
		this.renderer=false;
		this.compiler=false;
		this.parser  =false;
		this.importer=false;
		this.exporter=false;

		this.odbSrv=false;
		this.db    =false;

		this.parsedData=false;

		this.initialized=new Promise(function initializedPromise(resolve,reject){

			holder.init().then(function holderInitThen(d){
				resolve(d);
			}).catch(function(e){
				L('\nError Main#8','er');
				L(e);
				reject(e);
			});

			let timeout=60000;
			setTimeout(
				function(){
					reject(new Error('Initialization timeout of '+timeout+' exceeded.\nPossibly DB connection problem.'));
				},
				timeout
			);

		});

	}

	loadModules(){

		this.server  =Server.instance;
		this.renderer=new Renderer();
		this.compiler=new Compiler(this.cnf);
		this.parser  =new Parser();
		this.importer=new Importer(this.db,this.cnf);
		this.exporter=new Exporter();

		this.server.run(this.cnf);

	}

	initDB(){

		var holder=this;

		return new Promise(function (resolve,reject){

			holder.odbSrv=odb({
				host     :'localhost',
				port     :2424,
				username :holder.cnf.orient.server.username,
				password :holder.cnf.orient.server.password
			});

			holder.odbSrv.exists(
				holder.cnf.orient.db.name,
				holder.cnf.orient.db.storage
			).then(function srvExistsThen(d){

				if(d){

					holder.db=holder.odbSrv.use({
						name     :holder.cnf.orient.db.name,
						username :holder.cnf.orient.db.username,
						password :holder.cnf.orient.db.password
					});

					if(holder.db){
						resolve(holder.db);
					}else{
						L('\nError Main#7','er');
						L(e);
						reject(holder.db);
					}

				}else{

					holder.db=holder.odbSrv.create({
						name     :holder.cnf.orient.db.name,
						username :holder.cnf.orient.server.username,
						password :holder.cnf.orient.server.password
					}).then(function (d){
						resolve(d);
					}).catch(function(e){
						L('\nError Main#6','er');
						L(e);
						reject(e);
					});

				}

				/*console.log('\nError Main#21'.red);
				console.log(holder.db);
				reject(new Error(holder.db));*/

			}).catch(function(e){

				L('\nError Main#5','er');
				console.log(e);
				reject(e);

			});

		});

	}

	loadConfig(){

		var holder=this;

		return new Promise(function (resolve,reject){

			fs.readFile('./d/cnf.json',function(e,d){

				if(e){
					L('\nError Main#4','er');
					L(e);
					reject(e);
				}

				holder.cnf=JSON.parse(d);
				cplBranch(holder.cnf,holder.cnf);
				resolve(d);

			});

		});

	};

	init(){

		var holder=this;

		return new Promise(function (resolve,reject){

			holder.loadConfig().then(function (d0){

				holder.initDB().then(function (d){

					holder.loadModules();

					resolve(true);

				}).catch(function(e){
					L('\nError Main#3','er');
					L(e);
					reject(e);
				});

			}).catch(function(e){
				L('\nError Main#8','er');
				L(e);
				reject(e);
			});

		});

	}

	compilePumlToJson(pumlFile,jsonFile){

		//console.log('\n//at compilePumlToJson\n\t'+pumlFile+' => '+jsonFile);

		var holder=this;
		return new Promise(function (resolve,reject){

			//console.log('\n//at compilePumlToJson/Promise: ');

			//console.log(pumlFile+' exists = '+fs.existsSync(pumlFile));

			holder.parser.parse(pumlFile).then(function(d){

				holder.parsedData=d;

				//console.log('//on compilePumlToJson/parser.parse\nd: '+`${holder.parsedData}`.green);

				holder.compiler.compile(holder.parsedData,jsonFile).then(function(ok){

					//console.log('//on compilePumlToJson/compiler.compile\nd:\n');
					//console.log(ok);

					resolve(ok);

				}).catch(function(e){
					//console.log('//on compilePumlToJson/compiler error\ne:\n'.red);
					//console.log(e);
					reject(e);
				});

			}).catch(function(e){
				reject(e);
			});

		});

	}

	importPuml(pumlFile){

		var holder=this;

		return new Promise(function(resolve,reject){

			holder.parser.parse(pumlFile).then(function(d){

				holder.parsedData=d;

				//console.log('\nparsedData:');
				//console.log(d);

				holder.importer.importParsedData(holder.parsedData).then(function(d1){

					L(`d1: ${d1}`);
					resolve(d1);

				}).catch(function(e){

					L('\nError Main#1','er');
					L(e);
					reject(e);

				});

			}).catch(function(e){

				L('\nError Main#2','er');
				L(e);
				reject(e);

			});

		});

	}

	runServer(){
	}

	exportSchemaToPuml(){
	}

	render(){
	}

}

L('//after main\n');
