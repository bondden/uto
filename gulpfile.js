/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 08.05.2015.
 */
'use strict';
/**
 * (c) Boris Serdyuk (https://gist.github.com/just-boris/89ee7c1829e87e2db04c)
 * @param taskFn
 * @returns {Function}
 */
function wrapPipe(taskFn){
	return function(done){
		var onSuccess=function(){
			done();
		};
		var onError  =function(err){
			done(err);
		};
		var outStream=taskFn(onSuccess,onError);
		if(outStream && typeof outStream.on==='function'){
			outStream.on('end',onSuccess);
		}
	}
}

var gulp   =require('gulp'),
		util   =require('gulp-util'),
		changed=require('gulp-changed'),
		rename =require('gulp-rename'),
		srcmaps=require('gulp-sourcemaps'),
		babel  =require('gulp-babel'),
		mocha  =require('gulp-mocha'),
		path   =require('path')
	;
var d      ={
	js :{
		src :'lib.src/*.es7.js',
		dst :'lib/',
		maps:'maps/'
	},
	tst:{
		main:'test/main.js'
	}
};

gulp.task('js',wrapPipe(function(ok,er){
	return gulp.src(d.js.src)
		.pipe(changed(d.js.dst))
		.pipe(srcmaps.init())
		.pipe(babel({stage:0}).on('error',er))
		.pipe(srcmaps.write(d.js.maps))
		.pipe(rename(function(path){
			path.basename=path.basename.replace('.es7','');
		}))
		.pipe(gulp.dest(d.js.dst));
}));

gulp.task('test',['js'],wrapPipe(function(ok,er){
	return gulp.src(d.tst.main,{read:false})
		.pipe(mocha({
			reporter:'spec',
			ui      :'bdd'
		}).on('error',er));
}));

gulp.task('debug',['js'],function(){

});

gulp.task('watch',function(){
	gulp.watch(d.js.src,['js']);
});

gulp.task('default',['watch','js']);
