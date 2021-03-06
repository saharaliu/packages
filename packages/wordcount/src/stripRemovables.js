/**
 * Removes items matched in the regex.
 *
 * @param {Object} settings The main settings object containing regular expressions
 * @param {String} text     The string being counted.
 *
 * @return {string} The manipulated text.
 */
export default function ( settings, text ) {
	if ( settings.removeRegExp ) {
		return text.replace( settings.removeRegExp, '' );
	}
	return text;
}
