/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 25.05.2015.
 */

'use strict';
var
	clc=require('cli-color')
;

export class Util{

	static LOG_FILE='./d/log.log';

	static styles={
		'ne':clc.white,
		'er':clc.red,
		'ok':clc.green,
		'em':clc.yellow,
		'mb':clc.magentaBright,
		'sh':clc.whiteBright
	};

	static log(msg='\n',type='ne',e=false){

		console.log(Util.styles[type](msg));

		if(type==='er' && e){
			//console.log('\n');
			console.trace(clc.redBright(e));
			console.log('\n');
		}

	}

}
