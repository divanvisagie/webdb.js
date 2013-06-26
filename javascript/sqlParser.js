/*
	Created By: Divan Visagie

	This is just some skeleton code and the structure of this module could change completely,
	so far all it needs to do is convert some text in codemirror into some usable commands
*/


/*
	This should determine whether or not a sql string is valid
*/
function validate(){

	//TODO: make this work


}

/*
	Takes in a bulk string of sql statements and returns a trimmed array
*/
function getLines( sqlString ){

	var lines = sqlString.split( ';' );

	for ( var i in lines ){

		lines[i] = lines[i].trim();
	}

	return lines;
}

define( 'sqlParser' , {

	getLines : getLines
} );