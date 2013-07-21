 /* 
  Created By: Divan Visagie
  Created On: 2013/06/12
  License: MIT
  Version: 0.0.2
*/

var webdb = {};
webdb.db = null;
webdb.dbDetails = { //set default db details

    name: 'myDb',
    version: '1.0',
    description: '',
    size: 5 * 1024 * 1024
};

webdb.use = function(name, version, description, size) {

    //TODO: this will be used to store db details
    webdb.dbDetails = {

        name: name || 'myDb',
        version: version || '1.0',
        description: '',
        size: size || 5 * 1024 * 1024
    };

    webdb.open();
};

webdb.open = function() {

    //var dbSize = 5 * 1024 * 1024; // 5MB
    webdb.db = openDatabase(webdb.dbDetails.name, webdb.dbDetails.version, webdb.dbDetails.description, webdb.dbDetails.size); //
};

webdb.createTablesExample = function() {

    if (!webdb.db) {

        webdb.open();
    }

    var db = MyProject.webdb.db;
    db.transaction(function(tx) {

        /* Run Queries */
        tx.executeSql('[SQL statement]', [], function(tx, rs) { /* optional result set */

            var rows = r.rows; //this is the list of returned rows

            var first = r.rows.item(0); //gets first item in list

        }, function(tx, e) { /* Optional error handler */
        });

        console.log('tx', tx);
    });
};

//executes a transaction and returns a callback with the required data
webdb.executeTransaction = function(sqlString, parameters, callback) {

    if (!webdb.db) {
        webdb.open();
    }

    var db = webdb.db;
    db.transaction(function(tx) {

        tx.executeSql(sqlString, [], function(tx, rs) {

            var resultList = [];

            for (var i = 0; i < rs.rows.length; i++) {

                resultList.push(rs.rows.item(i));
            }

            if ( callback && typeof callback === 'function' )
                callback(resultList);

        }, function(tx, e) {

            e.queryString = sqlString;
            console.log('SQL error: ', e.message);
            callback( { error : e } );
        });

    });

};

/*database meta handlers*/
webdb.getTableColumns = function( tableName , callback ){


    /* TODO:

        Find out if there is a better way, if not , dich this entirely
     */
    webdb.executeTransaction( 'SELECT * FROM table_name LIMIT 1' , [] , function( resultSet ){


    } );
};


webdb.getSchema = function( callback ){ /* Get list of all items in sqlite master */


    webdb.executeTransaction( 'SELECT tbl_name AS tableName, type FROM sqlite_master' , [] , function( resultSet ){

        if ( callback && typeof callback === 'function' )
            callback( resultSet );
    } );
};


//the following functions are user level

/* Executes a sql statement with no return */
webdb.execute = function(sqlString, parameters) {
    
    webdb.executeTransaction(sqlString, parameters, function(res) {
    });
};

/* Executes a sql query and prints a relative object */
webdb.printObjects = function(sqlString, parameters) {

    webdb.executeTransaction(sqlString, parameters, function(res) {

        for ( var k in res ){

            console.log(res[k]);
        }
    });
};

webdb.printSchemaObjects = function(){

    webdb.getSchema( function( resultSet ){

        for ( var k in resultSet ){

            console.log( resultSet[k] );
        }
    } );
};

/* Executes a sql query and prints a table with the relavant data */
webdb.printTable = function(sqlString, parameters) {

    //TODO: improve printing
    webdb.executeTransaction(sqlString, parameters, function(res) {

        /* Build and print table headings */
        var head = "| ";
        if (res.length > 0) {
            for (var tbName in res[0]) {
                head += tbName;
                head += " | ";
            }
        }
        console.log(head);

        for (var k in res) { //loop through each result row

            var row = "| ";
            for (var field in res[k]) {

                row += res[k][field];
                row += " | ";
            }
            console.log(row);
            row = "| ";
        }
    });
};
