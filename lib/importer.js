/**
 * Created by Administrator on 07.05.2015.
 */
'use strict';

var

	odb         = require('oriento'),

	createServer=function(serverConfig,callback){

		var srv=odb(serverConfig);
		callback(srv);

	},

	createDB=function(srv,serverConfig,callback){

		var db=srv.use({
			"dbName":serverConfig.dbName,
			"username":serverConfig.username,
			"password":serverConfig.password
		}).then(function(db){
			console.log(db);
		});

	},

	importClass=function(classData,callback){

	},

	importClasses=function(parsedData,callback){

	},

	importDone=function(result){

	},

	importParsedData=function(serverConfig,parsedData){

		createServer(
			serverConfig,
			createDB(
				serverConfig,
				importClasses(
					parsedData,
					importDone(r)
				)
			)
		);

	}
;

module.exports={
	importParsedData:importParsedData
};
