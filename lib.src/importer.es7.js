/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 16.05.2015.
 */
'use strict';
/**
 * Connects to OrientDb server.
 * Creates DB schema or adds classes to existent schema from parsedData.
 */

import * as UtilLib from '../lib/util'

var
	fs=require('fs'),
	L	= UtilLib.Util.log
;

export class Importer {

	constructor(db,cnf){
		this.db=db;
		this.cnf=cnf;
	}

	insertClassProperty(className,propData){

		//console.log(clc.yellow('\t\t\t\tat insertClassProperty of '+className)+'{'+clc.whiteBright(propData.name+':'+propData.type)+'}');

		var holder=this;
		//var holder=this;
		return new Promise(function(resolve,reject){

			let q=`create property ${className}.${propData.name} ${propData.type}`;
			//console.log(q);

			holder.db.exec(q).then(function(r){

				//console.log(clc.greenBright('\tprop created '+className+'.'+propData.name+' with '+r.results.length+' results'));
				//console.log(r);
				//console.log('\n');

				resolve(r);

			}).catch(function(e){

				L('Error #3','er');
				L(e);
				L('query: '+q);

				//todo: normal logging or remove in open version
				let date=new Date();
				let t=date.toTimeString();
				fs.appendFile(
					holder.cnf.path.logFile,
					'['+t+'] '+__filename+': Error#3; query: "'+q+'"; raw: '+JSON.stringify(e)+'\n'
				);

				reject(e);

			});

		});
	}

	classExists(className){

		//console.log(clc.white('\t\t\t\tat classExists ')+clc.whiteBright(className));

		var holder=this;

		return new Promise(function(resolve,reject){

			//console.log(clc.white('\t\t\t\tat classExists.Promise of ')+clc.whiteBright(className));

			holder.db.class.get(className).then(function(classPtr){

				//console.log(clc.white('\nclassExists.exists '+className));

				resolve(classPtr);

			}).catch(function(e){

				resolve(false);

			});

		});

	}

	insertClassCheckless(classData){

		//console.log('\n\t\t\t\tat insertClassCheckless '+clc.whiteBright.bold(classData.name));

		var holder=this;

		return new Promise(function(resolve,reject){

			//console.log('\n\t\t\t\tat insertClassCheckless Promise of '+clc.whiteBright.bold(classData.name));

			let c={
				"name"     :classData.name,
				"extends"  :'',
				"abstract" :''
			};
			if(classData.hasOwnProperty('superClass')&&classData.superClass){
				c.extends=' extends '+classData.superClass;
			}
			if(classData.hasOwnProperty('abstract')&&classData.abstract){
				c.abstract=' ABSTRACT';
			}
			let q=`create class ${c.name}${c.extends}${c.abstract}`;

			//console.log(clc.whiteBright('\nq: '+q));

			holder.db.exec(q).then(function(r){

				//console.log(clc.green('\ncreated class '+classData.name));
				//console.log(r);

				//holder.db.class.get(classData.name).then(function(recentClass){

				let promises=[];
				classData.properties.forEach(function(p){
					promises.push(holder.insertClassProperty(classData.name,p));
				});
				promises.push(new Promise(function(rs,rj){
					setTimeout(function(){
						rj(new Error('Timeout '+holder.cnf.timeout+' ms'));
					},holder.cnf.timeout);
				}));

				Promise.all(promises).then(function(r){

					//console.log(clc.magentaBright('props '+classData.name));
					resolve(r);

				}).catch(function(e){

					L('Error #4','er');
					L(e);
					L('props of '+classData.name);
					L();
					reject(e);

				});

				/*}).catch(function(e){

					console.log(clc.red('Error #12'));
					console.log(e);
					reject(e);

				});*/

			}).catch(function(e){

				L('Error #5','er');
				L(e);
				reject(e);

			});

			//console.log('\n');

		});
	}

	insertClass(classData){

		//console.log(clc.white('\n\t\tat insertClass ')+clc.whiteBright.bold(classData.name));

		var holder=this;

		return new Promise(function(resolve,reject){

			//console.log(clc.white('\t\t\t\tat Promise of ')+clc.whiteBright(classData.name));

			holder.classExists(classData.name).then(function(r){

				//console.log(`\nclass ${classData.name} exists: `+clc.cyan(r));

				if(r){

					//console.log(clc.magentaBright('exists ')+classData.name);

					resolve(r);

				}else{

					//console.log(clc.magentaBright('absent ')+classData.name);

					if(classData.hasOwnProperty('superClass')&&classData.superClass){

						//console.log(clc.blue('\nclass ')+classData.name+clc.blueBright('.hasSuper')+'('+classData.superClass+')');

						let sClass=classData.find(function(el,i,a){
							return el.name==classData.superClass;
						});

						if(sClass){
							holder.insertClass(sClass).then(function(r){

								//console.log(clc.green('inserted parent '+r));

								holder.insertClassCheckless(classData).then(function(r1){

									//console.log(clc.green('inserted with parent '+r1));
									resolve(r1);

								}).catch(function(e){

									L('Error #12','er');
									L(e);
									reject(e);

								});

							}).catch(function(e){

								L('Error #10','er');
								L(e);
								reject(e);

							});
						}

					}else{

						//console.log(clc.blue('\nclass ')+classData.name+clc.blueBright('.hasSuper')+'('+clc.red('false')+')');

						holder.insertClassCheckless(classData).then(function(r){

							//console.log(clc.green('inserted parentless '+r));
							resolve(r);

						}).catch(function(e){

							L('Error #11','er');
							L(e);
							reject(e);

						});

					}

				}

			})/*.catch(function(e){
				if(e){
					console.log('\nclassExists.catch:');
					console.log(clc.red(e));
					console.log('\n');
				}
			})*/;

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

		return new Promise(function(resolve,reject){

			try{

				if(!data||!data.classes){
					reject(new Error('Error importing data: the data is incorrect.'));
				}

				let promises=[];
				data.classes.forEach(function(classData){
					promises.push(holder.insertClass(classData));
				});
				promises.push(new Promise(function(rs,rj){
					setTimeout(function(){
						rj(new Error('Timeout '+holder.cnf.timeout+' ms'));
					},holder.cnf.timeout);
				}));

				Promise.all(promises).then(function(r){

					console.log('all classes resolved'.green);
					resolve(r);

				}).catch(function(e){

					L('Error #6','er');
					L(e);
					reject(new Error('Error in database communication #1'));

				});

			}catch(e){

				L('Error #7','er');
				L(e);
				reject(new Error('Error in database communication #2'));

			}

		});

	}

}