/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 16.05.2015.
 */

/**
 * Connects to OrientDb server.
 * Creates DB schema or adds classes to existent schema from parsedData.
 */
'use strict';

import * as UtilLib from '../lib/util'

var
	fs=require('fs'),
	L	= UtilLib.Util.log,
	clc=require('cli-color')
;

export class Importer {

	constructor(db,cnf){
		this.db=db;
		this.cnf=cnf;
	}

	composeClass(classData){

		if(!classData.hasOwnProperty('name')||!classData.name){
			throw new Error('Error Importer#4: Incorrect class '+classData);
		}

		let cd={
			"name":classData.name,
			"parent":false,
			"queryString":''
		};

		let c={
			"name"     :classData.name,
			"extends"  :'',
			"abstract" :''
		};

		if(classData.hasOwnProperty('superClass')&&classData.superClass){
			c.extends=' extends '+classData.superClass;
			cd.parent=classData.superClass;
		}

		if(classData.hasOwnProperty('abstract')&&classData.abstract){
			c.abstract=' ABSTRACT';
		}

		cd.queryString=`create class ${c.name}${c.extends}${c.abstract};\n`;

		classData.properties.forEach(function(p){
			cd.queryString+=`create property ${c.name}.${p.name} ${p.type};\n`;
		});

		return cd;

	}

	composeQuery(data){

		let q='';
		if(data.classes.length===0){
			return q;
		}

		var holder=this;

		let classes=[];
		data.classes.forEach(function(c){
			classes.push(holder.composeClass(c));
		});

		//sort classes to set superClass to the top
		for(let i=0,l=classes.length;i<l;i++){
			if(!classes[i].parent)continue;
			for(let j=0;j<l;j++){
				if(classes[j].name===classes[i].parent && j>i){
					let t=JSON.parse(JSON.stringify(classes[j]));
					classes[j]=JSON.parse(JSON.stringify(classes[i]));
					classes[i]=t;
					break;
				}
			}
		}
		//

		classes.forEach(function(c,i){
			q+=c.queryString;
		});

		//q=`create class Tmp extends V;`;
		//q=`begin;${q}commit retry 5;`;

		q='begin;create class Tmp1 extends V;create class Tmp2 extends V;commit retry 10;';
		q='begin\ncreate class Tmp1 extends V\ncreate class Tmp2 extends V\ncommit retry 10';

		return q;

	}

	async runSubQuery(){

	}

	runQuery(q){
		var holder=this;
		return new Promise(function(rs,rj){



			holder.db.exec(q).then(function(r){

				rs(r);

			}).catch(function(e){

				L('Error Importer#3','er');
				L(e);
				rj(e);

			});

		});
	}

	/**
	 *
	 * @param data  : parsedData format
	 * @param connConfig : (cnf.json).orient format
	 * @returns {Promise}
	 */
	importParsedData(data){

		var holder=this;

		return new Promise(function(rs,rj){

			if(!data||!data.classes){
				rj(new Error('Error Importer#1: the data for import is incorrect'));
			}

			try{

				var q=holder.composeQuery(data);

			}catch(e){
				rj(e);
				return e;
			}

			holder.runQuery(q).then(function(r){
				rs(r);
			}).catch(function(e){
				L('Error Importer#2','er');
				L(e);
				rj(new Error('Error Importer#2: database communication'));
			});

		});
	}

}
