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
	clc=require('cli-color'),
	___=console.log,
	t=false,
	E=function(n=0,msg=false,e=false,rj=false,thr=false){

		if(!msg){
			msg=`: ${msg}\n`;
		}else{
			msg='\n';
		}
		L(`Error Importer#${n}${msg}`);
		L(e,'er');

		if(t)clearInterval(t);

		if(e){
			L(e,'er');
			if(rj){
				rj(e);
			}
			if(thr){
				throw e;
			}
		}

	}
;

export class Importer {

	constructor(db,cnf){
		this.db=db;
		this.cnf=cnf;
	}

	composeClass(classData){

		if(!classData.hasOwnProperty('name')||!classData.name){
			throw new Error('Error Importer#6: Incorrect class '+classData);
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

		cd.queryString=`create class ${c.name}${c.extends}${c.abstract}\n`;

		classData.properties.forEach(function(p){
			cd.queryString+=`create property ${c.name}.${p.name} ${p.type}\n`;
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

		return q;

	}

	runQuerySync(q){
		var holder=this;

		return new Promise(function(rs,rj) {

			let cycle=async function(qs){
				var r = null;
				try{
					for(let i=0,l=qs.length;i<l;i++){

						t=setInterval(function(){
							process.stdout.write(clc.blueBright('.'));
						},25);

						//___(clc.yellow(qs[i]));
						r = await holder.db.exec(qs[i]);
						//___(clc.magentaBright(JSON.stringify(r)));
						clearInterval(t);

					}
				}catch(e){
					E(6,'Query error',e);
				}
				return r;
			};

			let qs = q.trim().split('\n');

			cycle(qs).catch(function(e){

				E(4,'Query error',e,rj);

			}).then(function(r){

				rs(`${qs.length} records have been inserted`);

			});

		});

	}

	runQuery(q){
		var holder=this;
		return new Promise(function(rs,rj){

			holder.db.exec(q,{class: "s"}).then(function(r){

				rs(r);

			}).catch(function(e){

				E(3,'Query execution',e,rj);

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
				E(1,
					'the data for import is incorrect',
					new Error('Error Importer#1: the data for import is incorrect'),
					rj
				);
			}

			try{

				var q=holder.composeQuery(data);

			}catch(e){
				E(7,'Query composition',e,rj);
				return e;
			}

			let promises=[
				new Promise(function(rs,rj){
					setTimeout(function(){
						rj(new Error('Error Importer#5: Timeout '+holder.cnf.timeout+' ms exceeded'));
					},holder.cnf.timeout);
				}),
				holder.runQuery(q)
			];

			Promise.race(promises).then(function(r){
				if(t)clearInterval(t);
				rs(r);
			}).catch(function(e){
				E(2,'Database communication',e,rj);
			});

		});
	}

}
