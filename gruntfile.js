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
          style: process.env.NODE_ENV === 'live-development' ? 'expanded' : 'compressed',
          loadPath: [
            '.',
            'node_modules/govuk-frontend/dist',
            'node_modules/@ministryofjustice/frontend',
            'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend',
          ],
        },
        files: {
          'assets/stylesheets/application.css': 'frontend/application.scss',
        },
      },
    },
    rollup: {
      options: {
        format: 'es',
        name: 'ActivitiesFrontend',
        plugins: [nodeResolve(), commonjs()],
      },
      main: {
        files: {
          'assets/javascript/activities.min.js': 'frontend/index.js',
        },
      },
    },
    uglify: {
      dist: {
        files: {
          'assets/javascript/activities.min.js': 'assets/javascript/activities.min.js',
        },
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/govuk-frontend/dist/govuk/assets',
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
            cwd: 'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/assets/images/',
            src: ['./**/*'],
            dest: 'assets/dpr/images/',
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
      views: {
        files: [
          {
            expand: true,
            cwd: 'server/views',
            src: ['./**/*.njk'],
            dest: 'dist/server/views/',
          },
        ],
      },
    },
    clean: ['dist'],
    watch: {
      scripts: {
        files: ['frontend/**/*.{mjs,js}', 'frontend/**/*.scss'],
        tasks: ['dev-build'],
        options: {
          interrupt: true,
        },
      },
      views: {
        files: ['server/views/**/*.njk'],
        tasks: ['copy:views'],
        options: {
          interrupt: true,
        },
      },
    },
  })

  grunt.loadNpmTasks('grunt-contrib-sass')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-rollup')

  grunt.registerTask('default', ['clean', 'sass', 'rollup', 'uglify', 'copy'])
  grunt.registerTask('dev-build', ['sass', 'rollup', 'copy'])
  grunt.registerTask('clean-dev-build', ['clean', 'dev-build'])
}
