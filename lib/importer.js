/**
 * Created by Administrator on 07.05.2015.
 */
'use strict';

var

	odb         = require('oriento'),

	selectDB=function(serverConfig,callback){

		var srv=odb({
			host: 'localhost',
			port: 2480,
			username: serverConfig.username,
			password: serverConfig.password
		});

		srv.list().then(function(dbs){

			console.log(dbs.length);

			if(
				dbs.find(function(el,i,a){
					console.log(el);
					return el===serverConfig.dbName;
				})
			){
				//db exists

				var db=srv.use({
					"dbName":serverConfig.dbName,
					"username":serverConfig.username,
					"password":serverConfig.password
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
				});

			}

		}).error(function(e){
			console.log(e);
		});

	},

	importClasses=function(parsedData,db,callback){

		var nClassesImported=0;

		parsedData.classes.forEach(function(v,i){

			var className=v.name;
			db.class.create(className).then(function(r){
				if(r.originalName===className){

					nClassesImported++;
					if(i+1==steps.nClassesToImport){

						callback({'nClassesImported':nClassesImported});
					}

				}
			}).error(function(e){
				if(i==steps.nClassesToImport){

					callback({
						'error':e,
						'nClassesImported':nClassesImported
					});

				}
			});

		});

	},

	importParsedData=function(serverConfig,parsedData,callback){

		selectDB(
			serverConfig,
			function(db){
				importClasses(parsedData,db,callback(result));
			}
		);

	}
;

module.exports={
	importParsedData:importParsedData
};
