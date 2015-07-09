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
	L	= UtilLib.Util.log,
	clc=require('cli-color'),
	___=console.log
;

export class Importer {

	constructor(db,cnf){
		this.db=db;
		this.cnf=cnf;
		this.data={};
		this.classInsertAttempts=[];
	}

	insertClassProperty(className,propData){

		___(clc.yellow('\t\t\t<insertClassProperty_ofClass_'+className)+'{'+clc.whiteBright(propData.name+':'+propData.type)+'}>');

		var holder=this;
		//var holder=this;
		return new Promise(function(resolve,reject){

			resolve(true);

			let q=`create property ${className}.${propData.name} ${propData.type}`;
			___(q);

			holder.db.exec(q).then(function(r){

				___(clc.greenBright('\t<!-- prop created '+className+'.'+propData.name+' with '+r.results.length+' results')+' -->');
				___(r);
				___('\n');

				___(clc.yellow('\t\t\t</insertClassProperty_ofClass_'+className)+'{'+clc.whiteBright(propData.name+':'+propData.type)+'}>');

				resolve(r);

			}).catch(function(e){

				L('Error Importer#3','er');
				L(e);
				L('query: '+q);

				//todo: normal logging or remove in open version
				let date=new Date();
				let t=date.toTimeString();
				fs.appendFile(
					holder.cnf.path.logFile,
					'['+t+'] '+__filename+': Error#3; query: "'+q+'"; raw: '+JSON.stringify(e)+'\n'
				);

				___(clc.yellow('\t\t\t</insertClassProperty_ofClass_'+className)+'{'+clc.whiteBright(propData.name+':'+propData.type)+'}>');
				reject(e);

			});

		});
	}

	classExists(className){

		___(clc.white('\t<classExists_')+clc.whiteBright(className)+'>');

		var holder=this;

		return new Promise(function(resolve,reject){

			___(clc.white('\t\t<classExistsPromiseOf_')+clc.whiteBright(className)+'>');

			holder.db.class.get(className).then(function(classPtr){

				___(clc.white('\n<!-- classExists.exists '+className)+' -->');

				___(clc.white('\t\t</classExistsPromiseOf_')+clc.whiteBright(className)+'>');
				___(clc.white('\t</classExists_')+clc.whiteBright(className)+'>');
				resolve(classPtr);

			}).catch(function(e){
				___(clc.white('\t\t</classExistsPromiseOf_')+clc.whiteBright(className)+'>');
				___(clc.white('\t</classExists_')+clc.whiteBright(className)+'>');
				resolve(false);

			});

		});

	}

	insertClassCheckless(classData){

		___('\n\t<insertClassCheckless_'+clc.whiteBright.bold(classData.name)+'>');

		var holder=this;

		return new Promise(function(resolve,reject){

			___('\n\t\t<insertClassChecklessPromiseOf_'+clc.whiteBright.bold(classData.name)+'>');


			//do not repeat attempts

			___('<!--');
			___(holder.classInsertAttempts);
			___('-->');


			let tried=holder.classInsertAttempts.find(function(el,i,a){
				___(clc.redBright(`<!-- ${el} <-> ${classData.name} -->`));
				return el===classData.name;
			});
			if(tried){
				___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
				___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
				resolve(classData);
				return;
			}
			holder.classInsertAttempts.push(classData.name);
			//

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

			___(clc.whiteBright('\nq: '+q));

			holder.db.exec(q).then(function(r){

				___(clc.green('\n<!-- created class '+classData.name)+' -->');
				___(r);

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

					___('<!-- '+clc.magentaBright('props '+classData.name)+' -->');
					___('\n\t\t</insertClassChecklessPromiseOf_'+clc.whiteBright.bold(classData.name)+'>');
					___('\n\t</insertClassCheckless_'+clc.whiteBright.bold(classData.name)+'>');
					resolve(r);

				}).catch(function(e){

					L('Error Importer#4','er');
					L(e);
					L('props of '+classData.name);
					L();
					___('\n\t\t</insertClassChecklessPromiseOf_'+clc.whiteBright.bold(classData.name)+'>');
					___('\n\t</insertClassCheckless_'+clc.whiteBright.bold(classData.name)+'>');
					reject(e);

				});

			}).catch(function(e){

				L('Error Importer#5','er');
				L(e);
				___('\n\t\t</insertClassChecklessPromiseOf_'+clc.whiteBright.bold(classData.name)+'>');
				___('\n\t</insertClassCheckless_'+clc.whiteBright.bold(classData.name)+'>');
				reject(e);

			});

			___('\n');

		});
	}

	insertClass(classData){

		___(clc.white('<insertClass_')+clc.whiteBright.bold(classData.name)+'>');

		var holder=this;

		return new Promise(function(resolve,reject){

			___(clc.white('\t<PromiseOf_')+clc.whiteBright(classData.name)+'>');

			holder.classExists(classData.name).then(function(r){

				___(`\n<!-- class ${classData.name} exists: `+clc.cyan(r)+' -->');

				if(r){

					___('<!-- '+clc.magentaBright('exists ')+classData.name+'-->');
					___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
					___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
					resolve(r);

				}else{

					___('<!-- '+clc.magentaBright('absent ')+classData.name+' -->');

					if(classData.hasOwnProperty('superClass')&&classData.superClass){

						___('\n<!-- '+clc.blue('class ')+classData.name+clc.blueBright('.hasSuper')+'('+classData.superClass+') -->');

						let sClass=holder.data.classes.find(function(el,i,a){
							return el.name===classData.superClass;
						});

						___('<!-- '+clc.blueBright('sClass: ')+(sClass?sClass.name:'No')+' -->');

						if(sClass){
							holder.insertClass(sClass).then(function(r){

								___('<!-- '+clc.green('inserted parent '+r)+' -->');

								holder.insertClassCheckless(classData).then(function(r1){

									___('<!-- '+clc.green('inserted with parent '+r1)+' -->');
									___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
									___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
									resolve(r1);

								}).catch(function(e){

									L('Error Importer#12','er');
									L(e);
									___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
									___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
									reject(e);

								});

							}).catch(function(e){

								L('Error Importer#10','er');
								L(e);
								___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
								___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
								reject(e);

							});
						}

					}else{

						___(clc.blue('\nclass ')+classData.name+clc.blueBright('.hasSuper')+'('+clc.red('false')+')');

						holder.insertClassCheckless(classData).then(function(r){

							___('<!-- '+clc.green('inserted parentless '+r)+' -->');
							___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
							___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
							resolve(r);

						}).catch(function(e){

							L('Error Importer#11','er');
							L(e);
							___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
							___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
							reject(e);

						});

					}

				}

			}).catch(function(e){
				L('Error Importer#30','er');
				L(e);
				___(clc.white('\t</PromiseOf_')+clc.whiteBright(classData.name)+'>');
				___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
				reject(e);
			});

		});

		//___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');

	}

	/**
	 *
	 * @param data  : parsedData format
	 * @param connConfig : (cnf.json).orient format
	 * @returns {Promise}
	 */
	importParsedData(data){

		var holder=this;
		holder.data=data;
		holder.classInsertAttempts=[];

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

					___('all classes resolved'.green);
					resolve(r);

				}).catch(function(e){

					L('Error Importer#6','er');
					L(e);
					reject(new Error('Error in database communication #1'));

				});

			}catch(e){

				L('Error Importer#7','er');
				L(e);
				reject(new Error('Error in database communication #2'));

			}

		});

	}

}
