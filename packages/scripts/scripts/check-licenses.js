/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );
const { existsSync, readFileSync } = require( 'fs' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const {
	getCliArgs,
	hasCliArg,
	hasProjectFile,
	hasPackageProp,
} = require( '../utils' );

const ERROR = chalk.reset.inverse.bold.red( ' ERROR ' );

const args = getCliArgs();
const prod = hasCliArg( '--prod' ) || hasCliArg( '--production' );
const dev = hasCliArg( '--dev' ) || hasCliArg( '--development' );
const gpl2 = hasCliArg( '--gpl2' );

const gpl2Licenses = [
	'BSD',
	'BSD-2-Clause',
	'BSD-3-Clause',
	'BSD-like',
	'CC-BY-3.0',
	'CC-BY-4.0',
	'CC0-1.0',
	'GPL-2.0-or-later',
	'ISC',
	'MIT',
	'MIT/X11',
	'Public Domain',
	'Unlicense',
	'WTFPL',
];

const ossLicenses = [
	'Apache-2.0',
];

const licenses = [
	...gpl2Licenses,
	...( gpl2 ?  [] : ossLicenses ),
];

const licenseFiles = [
	'LICENSE',
	'LICENSE.md',
	'MIT-LICENSE.txt',
];

const licenseFileStrings = {
	BSD: 'Redistributions in binary form must reproduce the above copyright notice,',
	MIT: 'Permission is hereby granted, free of charge,',
};

const checkLicense = ( allowedLicense, licenseType ) => {
	if ( allowedLicense === licenseType ) {
		return true;
	}

	if ( ! licenseType ) {
		return false;
	}

	if ( licenseType.indexOf( 'OR' ) < 0 ) {
		return false;
	}

	const subLicenseTypes = licenseType.replace( /^\(*/g, '' ).replace( /\)*$/, '' ).split( ' OR ' ).map( ( e ) => e.trim() );

	return subLicenseTypes.reduce( ( satisfied, subLicenseType ) => {
		if ( checkLicense( allowedLicense, subLicenseType ) ) {
			return true;
		}
		return satisfied;
	}, false );

	return false;
};

const child = spawn.sync( 'npm', [
		'ls',
		'--parseable',
		...( prod ? [ '--prod' ] : [] ),
		...( dev ? [ '--dev' ] : [] ),
	]
);

const modules = child.stdout.toString().split( "\n" );

modules.forEach( ( path ) => {
	if ( ! path ) {
		return;
	}

	const filename = path + '/package.json';
	if ( ! existsSync( filename ) ) {
		console.error( `Unable to locate package.json in ${path}.` );
		process.exit( 1 );
	}

	const packageInfo = require( filename );
	const license = packageInfo.license || ( packageInfo.licenses && packageInfo.licenses.map( ( l ) => l.type ).join( ' OR ' ) );
	let licenseType = typeof license === 'object' ? license.type : license;

	if ( licenseType === undefined ) {
		licenseType = licenseFiles.reduce( ( detectedType, licenseFile )  => {
			if ( detectedType ) {
				return detectedType;
			}

			const licensePath = path + '/' + licenseFile;

			if ( existsSync( licensePath ) ) {
				const licenseText = readFileSync( licensePath ).toString();

				return Object.keys( licenseFileStrings ).reduce( ( detectedType, licenseStringType ) => {
					const licenseFileString = licenseFileStrings[ licenseStringType ];

					if ( licenseText.includes( licenseFileString ) ) {
						return licenseStringType;
					}

					return detectedType;
				}, detectedType );
			}
		}, false );
	}

	const allowed = licenses.reduce( ( satisfied, allowedLicense ) => {
		if ( checkLicense( allowedLicense, licenseType ) ) {
			return true;
		}
		return satisfied;
	}, false );

	if ( ! allowed ) {
		process.exitCode = 1;
		process.stdout.write( `${ ERROR } Module ${ packageInfo.name } has an incompatible license '${ licenseType }'.\n` );
	}
} );
