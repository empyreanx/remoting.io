'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		mochaTest: {
			src: ['test/**/*.js']
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			lib: {
				src: ['lib/**/*.js']
			},
			test: {
				src: ['test/**/*.js']
			},
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			lib: {
				files: '<%= jshint.lib.src %>',
				tasks: ['jshint:lib', 'mochaTest']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'mochaTest']
			},
		},
	});
	
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-mocha-test');
	
	grunt.registerTask('default', ['jshint', 'mochaTest']);
};
