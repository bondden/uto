/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 25.05.2015.
 */

'use strict';
var clc=require('cli-color');

export class Util{
	
	static styles={
		'ne':clc.white,
		'er':clc.red,
		'ok':clc.green,
		'em':clc.yellow
	};
	
	static log(msg='\n',type='ne'){
		
		console.log(Util.styles[type](msg));
		
	}
	
}