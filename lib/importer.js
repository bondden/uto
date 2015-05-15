/**
 * Created by Administrator on 07.05.2015.
 */
'use strict';

var

	odb         = require('oriento'),

	selectDb=function(){
		return new Promise();
	},

	importClassesDomain=function(){
		return new Promise();
	},

	/*


	selectDB=function(serverConfig,callback){

		var srv=odb({
			host: 'localhost',
			port: 2480,
			username: serverConfig.username,
			password: serverConfig.password
		});

		callback(srv.list()
		.then(function(dbs){
			console.log('There are '+dbs.length+' databases on the server.');
			callback(dbs);
		}).catch(function(e){
			console.log('catch');
			callback(e);
		}));

		if(srv.exists(
			serverConfig.dbName,
			serverConfig.dbStorage
		)){
			//db exists

			var db=srv.use({
				name:serverConfig.dbName,
				username:serverConfig.username,
				password:serverConfig.password
			});

			callback(db);

		}else{
			//create db

			srv.create({
				name: serverConfig.dbName,
				type: 'graph',
				storage: serverConfig.dbStorage
			}).then(function(db){

				callback(db);

			}).catch(function(e){
				console.log('catch 1');
				console.log(e);

				callback(e);

			});

		}

	},*/

	importClasses=function(parsedData,db,callback){

		var nClassesImported=0;
		var nClassesToImport=parsedData.classes.length;

		var rdy=function(num,res){
			if(num+1===nClassesToImport){
				callback(res);
			}
		};

		/*db.open().then(function(r){

			console.log('open.r:');
			console.log(r);

			callback({
				'result':r,
				'nClassesImported':nClassesImported
			});

		}).catch(function(e){

			console.log('open.e:');
			console.log(e);

			callback({
				'catch':e,
				'nClassesImported':nClassesImported
			});

		});*/

		db.query('select * from OUser',{params:{}}).then(function(r){

			console.log('list.r:');
			console.log(r);

			callback({
				'result':r,
				'nClassesImported':nClassesImported
			});

		}).catch(function(e){

			console.log('list.e:');
			console.log(e);

			callback({
				'catch':e,
				'nClassesImported':nClassesImported
			});

		});

		parsedData.classes.forEach(function(v,i){

			//console.log('\n'+i+'. '+v.name+' → db:'+db.name);

			/*db.class.list().then(function(r){
				console.log('list.r:');
				console.log(r);
				callback({
					'result':r,
					'nClassesImported':nClassesImported
				});
			}).catch(function(e){
				console.log('list.e:');
				console.log(e);
				callback({
					'catch':e,
					'nClassesImported':nClassesImported
				});
			});*/
			/*callback({
				'r':db.query('list classes',{}).then(function(r){
					console.log('q.list.e:');
					console.log(r);
					callback({
						'result':r,
						'nClassesImported':nClassesImported
					});
				}).catch(function(e){
					console.log('q.list.e:');
					console.log(e);
					callback({
						'catch':e,
						'nClassesImported':nClassesImported
					});
				}),
				'nClassesImported':0
			});*/

			/*callback({
				'message':'skip',
				'nClassesImported':nClassesImported
			});*/

			/*db.class.get(v.name).then(function(r){
				console.log('get('+v.name+').r:');
				console.log(r);
				callback({
					'result':r,
					'nClassesImported':nClassesImported
				});
			}).catch(function(e){
				console.log('get('+v.name+').e:');
				console.log(e);
				callback({
					'catch':e,
					'nClassesImported':nClassesImported
				});
			});*/

			/*db.class.create(v.name).then(function(r){
				console.log('created what');
				console.log(r);
				if(r.originalName===v.name){
					nClassesImported++;
				}
				rdy(i,{'nClassesImported':nClassesImported});
			}).catch(function(e){
				console.log('catch 2');
				console.log(e);
				rdy(i,{
					'catch':e,
					'nClassesImported':nClassesImported
				});
			});*/

		});

	},

	importParsedData=function(serverConfig,parsedData,callback){

		/*selectDB(
			serverConfig,
			function(db){
				importClasses(parsedData,db,callback);
			}
		);*/

		var result=function(r){
			callback(r);
		};

		importClassesDomain().then();
		selectDb().then();

	}
;

module.exports={
	importParsedData:importParsedData
};
