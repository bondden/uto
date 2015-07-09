/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 18.05.2015.
 */
'use strict';

require('babel/polyfill');
var
	fs    =require('fs-extra'),
	//chalk    =require('chalk'),
	//colors = require('colors'),
	clc = require('cli-color')
;
var Main=require('./lib/main').Main;
/*

function compileIt(d){

	fs.emptyDir(app.cnf.test.path.tmp,function fsEmptyDir(e){

		if(e){
			console.log('test: ');
			console.log(e);
			throw e;
		}

		app.compilePumlToJson(
			app.cnf.test.path.src.pumlFile,
			app.cnf.tst.path.dst.compiledTmpFile
		)
			.then(function importPumlThen(d){

				console.log(d);

			}).catch(function(e){

				console.log(e);
				throw e;

			});

	});

}
*/

function importIt(d){

	app.importPuml(
		app.cnf.test.path.src.pumlFile
	).then(function(r){

		console.log(clc.green(r));

	}).catch(function(e){

		console.log(clc.red('Error: Index#1'));
		console.log(e);
		throw e;

	});
}

function ph(d){
	console.log('init');
	console.log(d);
}

var app=new Main();
app.initialized.then(function(r){
	importIt(r);
}).catch(function(e){
	console.log(clc.red('Error: Index#2'));
	console.log(e);
	throw e;
});
