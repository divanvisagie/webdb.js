/*
	Created By: Divan Visagie
*/

/* Shim for non amd modules */
requirejs.config({
    appDir: '.',
    baseUrl: 'javascript',
    paths: {

        'jquery': ['jquery.min'],
        'bootstrap': ['../bootstrap/js/bootstrap.min'],
        'knockout': ['knockout.min'],
        'codemirror' : ['../codemirror/lib/codemirror'],
        'cmjs' : ['../codemirror/mode/javascript/javascript'],
        'cmsql' : ['../codemirror/mode/sql/sql'],
        'webdb' : ['../webdb']

    },
    shim: {
        /* Set bootstrap dependencies (just jQuery) */
        'bootstrap' : ['jquery'],
        'cmjs' : ['codemirror'],
        'cmsql' : ['codemirror'],
        'jqscroll' : ['jquery']
    }
});


require( [

	'tree',
	'sqlParser',
	'jquery',

	/* The following dont require variable representatives */
	'bootstrap',
	'codemirror',
	'cmjs',
	'knockout',
	'webdb'
],
function( tree , sqlParser , $ ){

	/* Knockout models */
	function TableRow( data ){

		var self = this;

		self.data = data.values;
		self.className = data.className || '';

		self.keys = ko.computed( function(){

			var keyList = Object.keys( data.values );
			return keyList;
		} );
		self.values = ko.computed( function(){

			return Object.keys( data.values ).map( function( key ){
				return data.values[ key ];
			} );
		} ) ;
	}

	function Table( data ){

		var self = this;

		self.title = data.title || 'Table';
		self.id = data.id || 'outputTable';
		self.headings = ko.observableArray( data.headings || [] );
		self.rows = ko.observableArray( data.rows || [] );
		self.tabid = data.tabid;
		self.className = data.className || 'table';
		self.tabClass = data.tabClass || '';

		self.idHash = ko.computed( function(){

			return '#' + this.id;
		} , this );

		self.tabidHash = ko.computed( function(){

			return '#' + self.tabid;

		} );

		self.tabDisplay = ko.computed( function(){

			return self.title + ' <span class="icon-remove-sign">close</span>';
		} );



	}


	function OutputViewModel(){

		var self = this;

		self.tables = ko.observableArray([

			new Table( {
				title : 'Output',
				id : 'outputTable',
				tabid : 'home',
				headings : [],
				rows : [],
				tabClass : 'immune'
			} )
		]);

		self.addTable = function( table ){

			self.tables.push( table );
		};

		self.resetTables = function(){

			self.tables([]);
		};

		self.close = function(){

			console.log( 'close args' , arguments , 'this:' , this , 'event' , event );
		};

	}

	var outputModel = new OutputViewModel();
	ko.applyBindings( outputModel );


	/* Every time tabs are changed some things need to be refreshed */
	function tabRefresh(){

		$( '.optcb' ).on( 'click' , function( e ){

			console.log( 'should close tab now' , e );

			var targ = $( e.target );

			var tabIndex = $( '#outputTab > li' ).index( targ.parents('li') );

			var hashTag = e.target.parentNode.hash;

			outputModel.tables.remove(function(item) {

				console.log ( item.tabidHash() , '=' , hashTag );
				return item.tabidHash() === hashTag;
			});

		} );

		$('#outputTab > li > a').click(function (e) {
			e.preventDefault();
			$(this).tab('show');
		});
	}

	/* Custom code  */

	var editor = CodeMirror.fromTextArea( document.querySelector( '#code' ), {
		lineNumbers: true,
		theme : 'solarized dark'
	});

	function attachTextListener(input, func) {

		if (window.addEventListener) {
			input.addEventListener( 'input' , func, false);
		} else
			input.attachEvent( 'onpropertychange', function() {
			func.call(input);
		});
	}

	function refreshSideBar(){

		webdb.getSchema( function ( rs ){


			/* filter the schema data so that the sidebar looks better */
			var tables = {},
				indexes = {},
				other = {},
				tableCount = 0,
				indexCount = 0,
				otherCount = 0;

			for ( var i in rs ){

				if ( rs[i].type === 'table' ){
					tables[ rs[i].tableName ] = rs[i];
					tableCount++;
				}
				else if ( rs[i].type === 'index' ){
					indexes[ rs[i].tableName ] = rs[i];
					indexCount++;
				}
				else{
					other[ rs[i].tableName ] = rs[i];
					otherCount++;
				}
			}

			var obj = {};

			if ( tableCount > 0 )
				obj.Tables = tables;
			if ( indexCount > 0 )
				obj.Indexes = indexes;
			if ( otherCount > 0 )
				obj.Other = other;

			tree.loadDbTree( webdb.dbDetails.name , obj );

		} );
	}

	refreshSideBar();


	/* creates a table from a json array */
	function tblWithJSONArr( jsonArr ){

		//console.log( headings );

		var table = document.createElement( 'table' );
		table.className = 'table table-bordered';
		table.style['background-color'] = 'white';
		table.style['border-radius'] = 0;

		var head = document.createElement( 'thead' );
		table.appendChild( head );

		/* get table headings */
		console.log( 'table with:' , jsonArr );

		var hrow = document.createElement( 'tr' );
		for ( var j in jsonArr[0] ){

			hrow.innerHTML += '<th>' + j + '</th>';
		}

		head.appendChild( hrow );

		/* table body */
		var tbody = document.createElement( 'tbody' );

		for ( var i in jsonArr ){

			var brow = document.createElement( 'tr' );
			for ( var k in jsonArr[i] ){

				brow.innerHTML += '<td>' + jsonArr[i][k] + '</td>';
			}
			tbody.appendChild( brow );
		}

		table.appendChild( tbody );

		return table;

	}


	/* Handle click events */
	$( '#dbNameButton' ).on( 'click' , function( ev ){

		webdb.use( $( '#dbName' ).val() );
		refreshSideBar();
	} );

	$( '#dbRefresh' ).on( 'click' , refreshSideBar );


	$( '#file-open' ).on( 'click', function(){

		if (window.File && window.FileReader && window.FileList && window.Blob) { //supported?

			/* create input element and trigger file open */
			var inp = document.createElement( 'input' );
			inp.type = 'file';
			$( inp ).trigger( 'click' );

			$( inp ).on( 'change' , function( ev ){

				//var oEvent = ev.originalEvent;

				var files = ev.originalEvent.target.files;

				var file = files[0];

				var reader = new FileReader();

				reader.onload = function( e ){

					var content = e.target.result;

					console.log( content );

					editor.setValue( content );
				};

				reader.readAsText( file );

			} );

		} else {
			alert('The File APIs are not fully supported in this browser.');
		}
	} );

	/* TODO: declare this function as a seperate handler */
	$( '#run' ).on( 'click' , function(){

		$('#outputTab a[href="#home"]').tab('show');

		var codeText = editor.getValue(); /* Get the full code text */

		//clear things up
		outputModel.tables([]);


		var lines = sqlParser.getLines( codeText );

		webdb.open();

		/* 
			The following contains a quick hack to determine the difference between a
			query and an execution, this logic or something better should be 
			dropped to webdb.js itself 
		*/

		var outputRows = [];

		function updateRows( data ){

			outputRows.push( data );
			/* 
				if the last line doesnt end with a semicolon then lines array will not have a "" at the end, 
				hence the terrible inline ternary 
			*/
			if ( outputRows.length === (lines[ lines.length-1 ] === '' ? lines.length-1 : lines.length) ){

				/* we use unshift here to keep output at the beginning of the tab list */
				outputModel.tables.unshift(

					new Table( {
						title : 'Output',
						id : 'outputTable',
						tabid : 'home',
						headings : [],
						rows : outputRows,
						tabClass : 'immune'
					} )
				);

				tabRefresh();

				$('#outputTab a[href="#home"]').tab('show');

			}
		}


		var err_handler = function( res ){

			if ( res.hasOwnProperty( 'error' ) ){

				updateRows( new TableRow( { values : { query : this.query , message : res.error.message } , className: 'error' }) );

			}else {

				updateRows( new TableRow( { values : { query : this.query , message : 'Command Executed successfully' } , className : 'success' }) );

			}

		};


		var output = [];
		var count = 0;

		var transaction_handler = function( res ){

			if ( res.hasOwnProperty( 'error' ) ){

				updateRows( new TableRow( { values : { query : this.query , message : res.error.message } , className:'error' }) );

			}
			else {
				count++;
				updateRows( new TableRow( { values : { query : this.query , message : 'Command Executed successfully' } , className:'success' }) );

				var newTableRows = [];
				for ( var i = 0; i < res.length; i++ ){

					newTableRows.push( new TableRow( { values : res[i] }) );
				}

				var newTbl = new Table( {
					title : 'Result ' + count,
					id : 'outputTable' + count,
					tabid : 'r' + count,
					headings : Object.keys(res[0]),
					rows : newTableRows,
					className : 'table table-bordered'
				} );

				outputModel.tables.push( newTbl );

				/* refresher script */

				tabRefresh();
			}


		};

		for (var k = 0; k < lines.length; k++ ){

			if ( lines[k].toUpperCase().indexOf( 'SELECT' ) > -1 ){ //its probably a select

				webdb.executeTransaction( lines[k] , [] , transaction_handler.bind( { query : lines[k] } ) );

			} else { //its just an execution

				if( lines[k] === '' ) continue; //skip the blanks
				webdb.executeTransaction( lines[k] , [] , err_handler.bind( { query : lines[k] } ) );
			}

		}


	} );

	/* Table initialization stuff */
	$('#outputTab > li > a[href="#home"]').tab('show');

	tabRefresh();

} );
