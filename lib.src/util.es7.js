/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 25.05.2015.
 */

'use strict';
var clc=require('cli-color');
var fs=require('fs');

export class Util{

	static styles={
		'ne':clc.white,
		'er':clc.red,
		'ok':clc.green,
		'em':clc.yellow,
		'erb':clc.redBright
	};

	static logFilter = function(s){
		var
			censorNote='FILTERED',
			censoredKeys=[
				'pass',
				'password',
				'userPass',
				'userPassword',
				'token'
			]
		;

		for(var i=0,l=censoredKeys.length;i<l;i++){
			s=(s+'').replace(
				new RegExp('"'+censoredKeys[i]+'"\s*:\s*"([^"]+)"',"ig"),
				'"'+censoredKeys[i]+'":"'+censorNote+'"'
			);
		}

		return s;
	};

	static log = function(msg='\n',style='ne',silent=false){

		//todo: transfer settings to log for a) defining a log file, b) setting logging on/off
		//if(!settings.log)return;

		var
			styles={
				'ne':clc.white,
				'er':clc.redBright,
				'ok':clc.green,
				'em':clc.yellow,
				'mb':clc.magentaBright,
				'sh':clc.whiteBright
			},
			apx  =false
		;

		//set console style style
		if(msg instanceof Error){
			style='er';
			apx='\n'+msg.stack;
		}

		//set log format
		if(typeof msg === 'object'){
			msg=JSON.stringify(msg);
			if(apx){
				msg+=apx;
			}
		}

		msg=Util.logFilter(msg);

		var d=new Date();

		fs.appendFile(
			'./d/utolog.log',
			d.toUTCString()+'\t'+msg+'\n',
			function(err){
				if(err) throw err;
			}
		);

		if(!silent){
			console.log(styles[style]('\nuto.log: '+msg));
		}

	};

}
