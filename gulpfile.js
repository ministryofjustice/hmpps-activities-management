const gulp = require('gulp')
const concat = require('gulp-concat')
const minify = require('gulp-minify')
const umd = require('gulp-umd')
const merge = require('merge-stream')
const sass = require('gulp-sass')(require('sass'))

const compileSass = (source, output) => {
  return merge(
    gulp.src(source).pipe(
      sass({
        quietDeps: true,
        outputStyle: 'compressed',
        includePaths: ['frontend/**/*.scss', 'node_modules/govuk-frontend', 'node_modules/@ministryofjustice/frontend'],
      })
    ),
    gulp.src([
      'node_modules/jquery-ui-dist/jquery-ui.min.css',
      'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css',
    ])
  )
    .pipe(concat(output))
    .pipe(minify())
    .pipe(gulp.dest('./assets/stylesheets'))
}

gulp.task(
  'dist:sass',
  () =>
    compileSass('frontend/application.scss', 'application.css') &&
    compileSass('frontend/application-ie8.scss', 'application-ie8.css')
)

gulp.task('dist:javascript', () =>
  gulp
    .src(['frontend/namespace.js', 'frontend/**/*.js', '!frontend/init.js'])
    .pipe(concat('activities.js'))
    .pipe(
      umd({
        exports: function () {
          return 'ActivitiesFrontend'
        },
        namespace: function () {
          return 'ActivitiesFrontend'
        },
      })
    )
    .pipe(gulp.dest('./assets/javascript'))
)

gulp.task('dist:assets', () => {
  return gulp
    .src(['node_modules/govuk-frontend/govuk/assets/**/*', 'node_modules/@ministryofjustice/frontend/moj/assets/**/*'])
    .pipe(gulp.dest('./assets'))
})

gulp.task('dist:package', () =>
  gulp
    .src([
      'node_modules/jquery/dist/jquery.js',
      'node_modules/jquery-ui-dist/jquery-ui.js',
      'node_modules/govuk-frontend/govuk/all.js',
      'node_modules/@ministryofjustice/frontend/moj/all.js',
      'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js',
      'assets/javascript/activities.js',
      'frontend/init.js',
    ])
    .pipe(concat('activities.js'))
    .pipe(
      minify({
        ext: {
          noSource: true,
          min: '.min.js',
        },
      })
    )
    .pipe(gulp.dest('./assets/javascript'))
)

gulp.task('dist', gulp.series('dist:sass', 'dist:javascript', 'dist:assets', 'dist:package'))
