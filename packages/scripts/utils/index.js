/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );
const { existsSync } = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getPackagePath, hasPackageProp } = require( './package' );
const { exit, getCliArgs } = require( './process' );

const first = list => list[ 0 ];

const hasCliArg = ( arg ) => getCliArgs()
	.some( ( value ) => first( value.split( '=' ) ) === arg );

const fromProjectRoot = ( fileName ) =>
	path.join( path.dirname( getPackagePath() ), fileName );

const hasProjectFile = ( fileName ) =>
	existsSync( fromProjectRoot( fileName ) );

const fromConfigRoot = ( fileName ) =>
	path.join( path.dirname( __dirname ), 'config', fileName );

const fromScriptsRoot = ( scriptName ) =>
	path.join( path.dirname( __dirname ), 'scripts', `${ scriptName }.js` );

const hasScriptFile = ( scriptName ) =>
	existsSync( fromScriptsRoot( scriptName ) );

const handleSignal = ( signal ) => {
	if ( signal === 'SIGKILL' ) {
		console.log(
			'The script failed because the process exited too early. ' +
			'This probably means the system ran out of memory or someone called ' +
			'`kill -9` on the process.'
		);
	} else if ( signal === 'SIGTERM' ) {
		console.log(
			'The script failed because the process exited too early. ' +
			'Someone might have called `kill` or `killall`, or the system could ' +
			'be shutting down.'
		);
	}
	exit( 1 );
};

const spawnScript = ( scriptName, args = [] ) => {
	if ( ! scriptName ) {
		console.log( 'Script name is missing.' );
		exit( 1 );
	}

	if ( ! hasScriptFile( scriptName ) ) {
		console.log( 'Unknown script "' + scriptName + '".' );
		console.log( 'Perhaps you need to update @wordpress/scripts?' );
		exit( 1 );
	}

	const { signal, status } = spawn.sync(
		'node',
		[
			fromScriptsRoot( scriptName ),
			...args
		],
		{ stdio: 'inherit' },
	);

	if ( signal ) {
		handleSignal( signal );
	}

	exit( status );
};

module.exports = {
	fromConfigRoot,
	getCliArgs,
	hasCliArg,
	hasProjectFile,
	hasPackageProp,
	spawnScript,
};
