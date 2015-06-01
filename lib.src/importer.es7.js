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
	I=require('cli-color'),
	L	= UtilLib.Util.log,
	C = console.log
;

export class Importer {

	constructor(db,cnf){
		this.db=db;
		this.cnf=cnf;
		this.parsedData=false;
		this.existentClasses=[];
	}

	getExistentClasses(){

		var holder=this;

		return new Promise(function(resolve,reject){

			C('//at getExistentClasses.Promise');

			holder.db.class.list().then(function(classes){

				C('db.class.list -> classes:');
				classes.forEach(function(v0,i0){
					C(v0.name);
				});
				L();

				classes.forEach(function(c){
					holder.existentClasses.push(c);
				});

				resolve(holder.existentClasses);

			}).catch(function(e){
				L('Importer #11','er',e);
				reject(e);
			});
		});

	}

	insertClassProperty(className,propData){

		C(I.yellow('\t\t\t\tat insertClassProperty of '+className)+'{'+I.whiteBright(propData.name+':'+propData.type)+'}');

		var holder=this;
		//var holder=this;
		return new Promise(function(resolve,reject){

			let q=`create property ${className}.${propData.name} ${propData.type}`;
			//C(q);

			holder.db.exec(q).then(function(r){

				C(I.greenBright('\tprop created '+className+'.'+propData.name+' with '+r.results.length+' results'));
				//C(r);
				C('\n');

				resolve(r);

			}).catch(function(e){

				L('Importer #3','er',e);
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

		C(I.white('\t\t\t\tat classExists ')+I.whiteBright(className));

		var holder=this;

		return new Promise(function(resolve,reject){

			C(I.white('\t\t\t\tat classExists.Promise of ')+I.whiteBright(className));

			holder.db.class.get(className).then(function(classPtr){

				C(I.white('\nclassExists.exists '+className));

				resolve(classPtr);

			}).catch(function(e){
				resolve(false);
			});

		});

	}

	/**
	 *
	 * @param classes:Array - list of classes to be dropped
	 */
	dropClasses(classes){

		C('//at dropClasses');

		var holder=this;

		if(holder.cnf.orient.dropClassesBeforeImport){

			let promises=[];
			classes.forEach(function(c,i){
				promises.push(new Promise(function(resolve,reject){
					holder.db.class.drop(c.name).then(function(r){
						resolve(r);
					}).catch(function(e){
						reject(e);
					});
				}));
			});
			return Promise.all(promises);

		}else{

			return new Promise(function(resolve,reject){
				resolve(true);
			});

		}

	}

	insertClassCheckless(classData){

		C('\n\t\t\t\tat insertClassCheckless '+I.whiteBright.bold(classData.name));

		var holder=this;

		return new Promise(function(resolve,reject){

			C('\n\t\t\t\tat insertClassCheckless Promise of '+I.whiteBright.bold(classData.name));

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

			L('\nq: '+q);

			holder.db.exec(q).then(function(r){

				L('\ncreated class '+classData.name,'ok');
				L(r);

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

					L('props '+classData.name,'mb');
					resolve(r);

				}).catch(function(e){

					L('Importer #4','er',e);
					L('props of '+classData.name);
					L();
					reject(e);

				});

				/*}).catch(function(e){

					C(clc.red('Importer #12'));
					C(e);
					reject(e);

				});*/

			}).catch(function(e){

				L('Importer #5','er',e);
				reject(e);

			});

			C('\n');

		});
	}

	insertClass(classData){

		C(I.white('\n\t\tat insertClass ')+I.whiteBright.bold(classData.name));

		var holder=this;

		return new Promise(function(resolve,reject){

			C(I.white('\t\t\t\tat Promise of ')+I.whiteBright(classData.name));

			holder.classExists(classData.name).then(function(rClassExists){

				C('\nclass '+I.whiteBright(classData.name)+' exists: '+I.cyan(rClassExists));

				if(rClassExists){

					C(I.magentaBright('exists ')+classData.name);
					resolve(rClassExists);

				}else{

					C(I.magentaBright('absent ')+classData.name);
					C(I.white('Checking parents...'));
					//C(I.white(JSON.stringify(classData)));

					if(classData.hasOwnProperty('superClass') && classData.superClass){

						C(I.blue('\nclass ')+classData.name+I.blueBright('.hasSuper')+'('+classData.superClass+')');

						/**
						 * Does superClass data exist?
						 * @type {T}
						 */
						let sClass=holder.parsedData.classes.find(function(el,i,a){
							//C(`${el.name}<>${classData.superClass}:${el.name==classData.superClass}`);
							return el.name==classData.superClass;
						});

						if(!sClass){
							sClass=holder.existentClasses.find(function(el,i2,a2){
								return el.name==classData.superClass;
							});
						}

						C(I.yellow('sClass:'));

						if(!sClass){
							C('no superClass');
						}

						if(sClass){

							C(sClass.name);
							C('\nInserting super class for '+classData.name+'... ');

							holder.insertClass(sClass).then(function(r){

								C(I.green('inserted parent '+r));

								holder.insertClassCheckless(classData).then(function(r1){

									C(I.green('inserted with parent '+r1));
									resolve(r1);

								}).catch(function(e){

									L('Importer #12','er',e);
									reject(e);

								});

							}).catch(function(e){

								L('Importer #10','er',e);
								reject(e);

							});
						}

					}else{

						C(I.blue('\nclass ')+classData.name+I.blueBright('.hasSuper')+'('+clc.red('false')+')');

						holder.insertClassCheckless(classData).then(function(r){

							C(I.green('inserted parentless '+r));
							resolve(r);

						}).catch(function(e){

							L('Importer #11','er',e);
							reject(e);

						});

					}

				}

				/*.catch(function(e){
				if(e){
				C('\nclassExists.catch:');
				C(clc.red(e));
				C('\n');
				}
				})*/

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

		return new Promise(function(resolve,reject){

			if(!data||!data.classes){
				reject(new Error('Importer Error #13 importing data: the data is incorrect.'));
			}

			holder.dropClasses(data.classes).then(function(rd){

				L('dropClasses result: '+I.yellowBright(rd));

				holder.getExistentClasses().then(function(rExistentClasses){

					C('rExistentClasses:');
					rExistentClasses.forEach(function(v0,i0){
						C(v0.name);
					});
					L();

					try{

						holder.parsedData=data;

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

							L('all classes resolved','ok');
							resolve(r);

						}).catch(function(e){

							L('Importer #6','er',e);
							reject(new Error('Error in database communication #1'));

						});

					}catch(e){

						L('Importer #7','er',e);
						reject(new Error('Error in database communication #2'));

					}

				}).catch(function(e){
					L('Importer #12','er',e);
					reject(e);
				});

			}).catch(function(e){
				L('Importer #14','er',e);
				reject(e);
			});


		});

	}

}

