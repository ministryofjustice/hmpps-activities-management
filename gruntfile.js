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
    concat: {
      css: {
        webkit: {
          src: [
            'assets/stylesheets/application.css',
            'node_modules/jquery-ui-dist/jquery-ui.min.css',
            'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css',
          ],
          dest: 'assets/stylesheets/application.css',
        },
        ie8: {
          src: [
            'assets/stylesheets/application-ie8.css',
            'node_modules/jquery-ui-dist/jquery-ui.min.css',
            'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css',
          ],
          dest: 'assets/stylesheets/application-ie8.css',
        },
      },
      js: {
        src: ['frontend/namespace.js', 'frontend/**/*.js', '!frontend/vendor/**/*.js', '!frontend/init.js'],
        dest: 'assets/javascript/activities.js',
      },
      jsDist: {
        src: [
          'node_modules/jquery/dist/jquery.js',
          'node_modules/jquery-ui-dist/jquery-ui.js',
          'node_modules/govuk-frontend/govuk/all.js',
          'node_modules/@ministryofjustice/frontend/moj/all.js',
          'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js',
          'assets/javascript/activities.js',
          'frontend/init.js',
        ],
        dest: 'assets/javascript/activities.js',
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
        ],
      },
    },
    watch: {
      scripts: {
        files: ['**/*.scss', '**/*.js'],
        tasks: ['default'],
      },
    },
  })

  grunt.loadNpmTasks('grunt-contrib-sass')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-umd')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('default', ['sass', 'concat:css', 'concat:js', 'umd', 'concat:jsDist', 'uglify', 'copy'])
  grunt.registerTask('watch', ['watch'])
}
