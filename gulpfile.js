/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 08.05.2015.
 */
'use strict';

var gulp   =require('gulp'),
    util   =require('gulp-util'),
    changed=require('gulp-changed'),
    rename =require('gulp-rename'),
    srcmaps=require('gulp-sourcemaps'),
    babel  =require('gulp-babel'),
    mocha  =require('gulp-mocha'),
		plumber=require('gulp-plumber'),
    path   =require('path')
;
var d      ={
	js  :{
		src  :'lib.src/*.es7.js',
		dst  :'lib/',
		maps :'maps/'
	},
	tst :{
		main :'test/main.js'
	}
};

gulp.task('js',function(){
	return gulp.src(d.js.src)
		.pipe(plumber())
		.pipe(changed(d.js.dst))
		.pipe(srcmaps.init())
		.pipe(babel({stage:0}))
		.pipe(srcmaps.write(d.js.maps))
		.pipe(rename(function(path){
			path.basename=path.basename.replace('.es7','');
		}))
		.pipe(gulp.dest(d.js.dst));
});

gulp.task('test',['js'],function(){
	return gulp.src(d.tst.main,{read:false})
		.pipe(mocha({
			reporter :'dot',
			ui       :'bdd'
		}));
});

gulp.task('debug',['js'],function(){

});

gulp.task('watch',function(){
	gulp.watch(d.js.src,['js']);
});

gulp.task('default',['watch','js']);
