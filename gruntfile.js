/* eslint-disable import/no-extraneous-dependencies */
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

module.exports = grunt => {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {
      dist: {
        options: {
          'no-source-map': '',
          quiet: true,
          style: 'compressed',
          loadPath: ['.', 'node_modules/govuk-frontend', 'node_modules/@ministryofjustice/frontend'],
        },
        files: {
          'assets/stylesheets/application.css': 'frontend/application.scss',
          'assets/stylesheets/application-ie8.css': 'frontend/application-ie8.scss',
        },
      },
    },
    rollup: {
      options: {
        format: 'umd',
        name: 'ActiviesFrontend',
        plugins: [nodeResolve(), commonjs()],
      },
      main: {
        files: {
          'assets/javascript/activities.js': 'frontend/index.js',
        },
      },
    },
    concat: {
      css: {
        src: [
          'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css',
          'assets/stylesheets/application.css',
        ],
        dest: 'assets/stylesheets/application.css',
      },
      cssIe8: {
        src: [
          'assets/stylesheets/application-ie8.css',
          'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css',
        ],
        dest: 'assets/stylesheets/application-ie8.css',
      },
    },
    umd: {
      all: {
        options: {
          src: 'assets/javascript/activities.js',
          objectToExport: 'ActivitiesFrontend',
        },
      },
    },
    uglify: {
      dist: {
        files: {
          'assets/javascript/activities.min.js': 'assets/javascript/activities.js',
        },
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/govuk-frontend/govuk/assets',
            src: ['./**/*'],
            dest: 'assets/',
          },
          {
            expand: true,
            cwd: 'node_modules/@ministryofjustice/frontend/moj/assets',
            src: ['./**/*'],
            dest: 'assets/',
          },
          {
            expand: true,
            cwd: 'frontend/images',
            src: ['./**/*'],
            dest: 'assets/images/',
          },
          {
            expand: true,
            cwd: 'frontend/vendor',
            src: ['./**/*'],
            dest: 'assets/vendor/',
          },
        ],
      },
    },
    watch: {
      scripts: {
        files: ['frontend/**/*.js', 'frontend/**/*.scss'],
        tasks: ['default'],
      },
    },
  })

  grunt.loadNpmTasks('grunt-contrib-sass')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-rollup')

  grunt.registerTask('default', ['sass', 'concat:css', 'concat:cssIe8', 'rollup', 'uglify', 'copy'])
}
