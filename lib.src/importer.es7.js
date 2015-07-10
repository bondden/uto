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
	__p=process.stdout.write,
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

	bubbleSort(arr,parent='superClass',name='name'){

		let a=JSON.parse(JSON.stringify(arr));
		return new Promise(function(rs,rj){
			let swapped;
			do{
				swapped=false;
				for(let i=0,l=a.length-1;i<l;i++){
					if(a[i][parent]===a[i+1][name]){
						let temp=JSON.parse(JSON.stringify(a[i]));
						a[i]=JSON.parse(JSON.stringify(a[i+1]));
						a[i+1]=temp;
						swapped=true;
					}
				}
			}while(swapped);
			rs(a);
		});

	}

	dftSort(arr,parent='superClass',name='name'){

		let a0=JSON.parse(JSON.stringify(arr));
		return new Promise(function(rs,rj){

			let a1=a0.sort(function(a,b){
				___(`${a[name]}→${a[parent]}  ↔  ${b[name]}→${b[parent]}`);
				if(a[parent]===b[name]){___(' a↓b↑');return 1;}
				if(b[parent]===a[name]){___(' a↑b↓');return -1;}
				return 0;
			});

			rs(a1);
		});

	}

	inheritanceSort(arr,parent='superClass',name='name'){

		let a=JSON.parse(JSON.stringify(arr));
		return new Promise(function(rs,rj){

			let b=[];
			for(let j=0,l=a.length;j<l;j++){

				let top=a[j];
				for(let i=j,l=a.length;i<l;i++){
					___(`${a[name]}→${a[parent]}  ↔  ${a[i][name]}→${a[i][parent]}`);
					if(top[parent]===a[i][name]){
						___(' a↓b↑');
						top=JSON.parse(JSON.stringify(a[i]));
					}
				}
				if(!b.find(function(el,k,a){
					return el.name===top.name;
				})){
					b.push(top);
				}

			}

			for(let j=0,l=a.length;j<l;j++){
				if(!b.find(function(el){
						return el.name===a[j].name;
				})){
					b.push(a[j]);
				}
			}


			//let a1=b.sort(function(x,y){
			//	___(`${x[name]}→${x[parent]}  ↔  ${y[name]}→${y[parent]}`);
			//	if(x[parent]===y[name]){___(' a↓b↑');return 1;}
			//	if(y[parent]===x[name]){___(' a↑b↓');return -1;}
			//	return 0;
			//});

			rs(a1);
		});

	}

	cycledSort(arr,parent='superClass',name='name'){

		let a0=JSON.parse(JSON.stringify(arr));
		return new Promise(function(rs,rj){

			for(let i=0,l=a0.length;i<l;i++){
				a0=a0.sort(function(a,b){
					___(`${a[name]}→${a[parent]}  ↔  ${b[name]}→${b[parent]}`);
					if(a[parent]===b[name]){___(' a↓b↑');return 1;}
					if(b[parent]===a[name]){___(' a↑b↓');return -1;}
					return 0;
				});
			}

			rs(a0);

		});

	}

	generalizationSort(arr,parent='superClass',name='name'){

		function branch(o,a){
			for(let i=0,l=a.length;i<l;i++){
				if(a[i][parent]===o[name]){
					a[i].level=o.level+1;
					branch(a[i],a);
				}
			}
		}

		let a=JSON.parse(JSON.stringify(arr));
		return new Promise(function(rs,rj){

			for(let i=0,l=a.length;i<l;i++){

				//level 0
				a[i].level=a[i][parent]?1:0;

				if(a[i].level){
					a[i].hasParentInTheArr=a.find(function(el,i,arrPtr){
						return el[name]===a[i][parent];
					});
					if(!a[i].hasParentInTheArr){
						a[i].level=0;
					}
				}

				//level>0
				if(a[i].level){

				}

				branch(a[i],a);

			}

			let tops=a.sort(function(x,y){
				//___(`${a[name]}→${a[parent]}  ↔  ${b[name]}→${b[parent]}`);
				//if(a[parent]===b[name]){___(' a↓b↑');return 1;}
				//if(b[parent]===a[name]){___(' a↑b↓');return -1;}
				//return 0;
				return x.level-y.level;
			}).map(function(o){
				return {
					[name]:o[name],
					[parent]:o[parent]
				};
			});


			rs(tops);
		});

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

		cd.queryString+=`create class ${c.name}${c.extends}${c.abstract}\n`;

		classData.properties.forEach(function(p){
			cd.queryString+=`create property ${c.name}.${p.name} ${p.type}\n`;
		});

		return cd;

	}

	cleanDb(classes){
		var holder=this;

		return new Promise(function(rs,rj){

			let q='';
			let ce=[];

			holder.db.class.list().then(function(existentClasses){

				existentClasses.forEach(function(v,k){
					existentClasses[k]={
						"name":v.name,
						"superClass":v.superClass
					};
				});

				___(clc.magenta('\nexistentClasses'));
				___(existentClasses);
				___('\n');

				existentClasses.forEach(function(c){
					let isSys=holder.cnf.modules.importer.systemClasses.find(function(el,i,a){
						return el===c.name;
					});
					if(isSys)return;
					ce.push(c);
				});

				___(clc.magenta('\nbefore sort'));
				___(ce);
				___('\n');

				//sort classes to set superClass to the top
				//for(let i=0,l=ce.length;i<l;i++){
				//	//___('super 0: '+ce[i].name+' extends '+ce[i].superClass);
				//	if(!ce[i].superClass)continue;
				//	//___('super 1: '+ce[i].name+' extends '+ce[i].superClass);
				//	for(let j=0;j<l;j++){
				//		if(ce[j].name===ce[i].superClass && j>i){
				//			let t=JSON.parse(JSON.stringify(ce[j]));
				//			ce[j]=JSON.parse(JSON.stringify(ce[i]));
				//			ce[i]=t;
				//			break;
				//		}
				//	}
				//}

				//let ce1=ce.sort(function(a,b){
				//	___(`${a.name}→${a.superClass}  ↔  ${b.name}→${b.superClass}`);
				//	if(a.superClass===b.name){___(' a↓b↑');return 1;}
				//	if(b.superClass===a.name){___(' a↑b↓');return -1;}
				//	return 0;
				//});
				//

				holder.generalizationSort(ce).catch(function(e){
					E(11,'sorting',e,rj);
				}).then(function(a){

					___(clc.magenta('\nafter sort'));
					___(a);
					___('\n');

					for(let i=a.length-1;i>=0;i--){
						let nm=a[i].name;
						q+=`truncate class ${nm} UNSAFE\n`;
						q+=`drop class ${nm}\n`;
					}

					L(clc.yellow('q:\n'+q)+'\n');

					rs(q);

				});

			}).catch(function(e){
				E(10,'Listing classes',e,rj);
			});

		});

	}

	composeQuery(data){

		var holder=this;

		return new Promise(function(rs,rj){

			let q='';
			//it not nessessary to have classes to import, if we want just to clean DB
			//if(data.classes.length===0){
			//	L('No classes to import');
			//	rs(q);
			//	return q;
			//}

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

			holder.cleanDb(classes).then(function(dropQuery){

				q+=dropQuery;

				classes.forEach(function(c,i){
					q+=c.queryString;
				});

				//Schema changes are not transactional
				//q=`begin\n${q}\ncommit`;
				rs(q);

			}).catch(function(e){
				E(11,'Composing query',e,rj);
			});

		});

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

						r = await holder.db.exec(qs[i]);

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

			//rs('STOPPED');
			//return('STOPPED');

			holder.db.exec(q,{"class": "s"}).then(function(r){
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

			//simple input data check
			if(!data||!data.classes){
				let msg='the data for import is incorrect';
				E(1,msg,new Error(msg),rj);
			}

			////choose a method
			//var runMethod=function(q=''){
			//	return new Promise(function(rs,rj){
			//		let msg='No supported import method specified in config';
			//		E(9,msg,new Error(msg),rj);
			//	});
			//};
			//
			//switch(holder.cnf.modules.importer.method){
			//	case 'rewrite':
			//		runMethod=holder.runQuery;
			//		break;
			//	default:
			//}

			//compose query and run
			holder.composeQuery(data).catch(function(eq){
				E(7,'Query composition',eq,rj);
			}).then(function(q){

				//limit execution time
				let promises=[
					new Promise(function(rs,rj){
						setTimeout(function(){
							rj(new Error('Error Importer#5: Timeout '+holder.cnf.timeout+' ms exceeded'));
						},holder.cnf.timeout);
					}),
					holder.runQuery(q)
				];

				//get result
				Promise.race(promises).catch(function(e){
					E(2,'Database communication',e,rj);
				}).then(function(r){
					if(t)clearInterval(t);
					rs(r);
				});

			});

		});
	}

}
