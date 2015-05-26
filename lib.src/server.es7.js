/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 16.05.2015.
 */
'use strict';

var
	express = require('express'),
	path = require('path'),
  clc = require('cli-color')
;

let singleton = Symbol();
let singletonEnforcer = Symbol();

export class Server{

	constructor(enforcer){

		if(enforcer != singletonEnforcer){
			throw "Cannot construct Server singleton";
		}else{
			console.log('Server initialized');
		}

	}

	static get instance(){
		if(!this[singleton]) {
			this[singleton] = new Server(singletonEnforcer);
		}
		return this[singleton];
	}

	run(cnf){

		console.log(clc.whiteBright('//at Server.run'));

		this.cnf=cnf;
		this.x=express();

		this.x.use(express.static(path.join(__dirname,cnf.p.web.assets)));
		this.x.use('/d/web/',function(err,req,res,next){
			res.status(err.status || 200);
			res.send('<b>test</b>');
		});

		this.x.get('/', function (req, res) {
			res.send('Hello World');
		});

		this.x.listen(80);
	}

}
