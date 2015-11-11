var gulp = require( 'gulp' )
  , cp = require( 'child_process' )
  , qmakePath
  , path = require( 'path' )
  , events = require( 'events' )
  , controller = new events.EventEmitter()
  , projName = 'Bookwright.pro'
  , projPath = path.join( __dirname, projName )
  , util = require( 'util' )
  , os = require( 'os' );


if (isWin())
{
  qmakePath = "C:\\Qt\\5.4.1_build\\msvc2013\\bin\\qmake.exe";
}
else 
{
  qmakePath = "/Users/mbusenitz/Qt5.4.1/5.4/clang_64/bin/qmake";
} 

gulp.task( 'generateDebug', generateDebug );
gulp.task( 'generateTest', generateTest );
gulp.task( 'buildDebug', buildDebug );
gulp.task( 'buildTest', buildTest ); 
gulp.task( 'runDebug', runDebug );
gulp.task( 'runTest', runTest );
gulp.task( 'default', function() {
  gulp.watch( '../**/*.{pro,pri}', runDebug );
  runDebug();
});

function runTest() {
  controller.emit( 'test' ); 
  buildTest()
  .then( function() {
    spawn( 'Debug/TestBookWright.app/Contents/MacOS/TestBookWright' );
  });
}

function runDebug() {
  controller.emit( 'debug' );
  buildDebug();
}

function buildTest() {
  return new Promise( function(resolve, reject) {
    generateTest()
    .then( function() {
      build( 'TestBookWright.xcodeproj', 'TestBookWright' )
      .then( resolve );
    });
  }); 
}

function buildDebug() {
  return generateDebug()
  .then( function() {
    
    var child = spawn( '/Applications/Xcode.app/Contents/MacOS/Xcode', ['BookWright.xcodeproj'] );
    
    controller.once( 'debug', function() { 
      child.kill(); 
    })

    build( 'BookWright.xcodeproj', 'BookWright' );
  }); 
}

function build( project, scheme ) {
  return spawnBuildTask( 'xctool', ['-project', project, '-scheme', scheme ] );
}

function qmakeOptions() {
  
  var result = [ path.join( '..', 'Bookwright.pro' ), 'CONFIG+=debug', '-spec' ];
  if (isWin())
  {
    result = result.concat( [ 'win32-msvc2012', '-tp', 'vc' ] );
  }
  else 
  {
    result = result.concat( [ 'macx-xcode' ] );
  }
  return result;
}

function generateDebug() {
  controller.emit( 'kill' );
  return qmake( qmakeOptions() );
}

function generateTest() {
  return new Promise( function(resolve, reject) {
    spawn( qmakePath, qmakeOptions().concat( 'CONFIG+=testmake' ) )
    .on( 'exit', resolve );
  });
}

function qmake( args ) {
  return spawnBuildTask( qmakePath, args );
}

function spawnBuildTask( cmd, args ) {
  
  return new Promise( function( resolve, reject ) {
    var child = spawn( cmd, args )
    .on( 'exit', function(code) {
      if (code) {
        reject();
      }
      else {
        resolve();
      }
    });

    controller.once( 'kill', function() {
      console.log( 'kill', child.pid ); 
      child.kill();
    }); 
  });
}

function spawn( cmd, args ) {
  console.log( cmd, util.inspect( args ) );   
  return cp.spawn( 
      cmd
    , (typeof(args) === 'undefined' ? [] : args)
    , { stdio: 'inherit' } 
  );
}

function isWin() {
  return os.platform().match( 'win32' ) ? true : false; 
}


