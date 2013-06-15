$(function () {
    $('.tree li').hide();
    $('.tree li:first').show();
    $('.tree li').on('click', function (e) {
        var children = $(this).find('> ul > li');
        if (children.is(":visible")) children.hide('fast');
        else children.show('fast');
        e.stopPropagation();
    });
});

function tree(data) {    
    if (typeof(data) == 'object') {        
       
       var ostring = '<ul>\n';
      
      for ( var x in data ){
      
        ostring += '<li> <a href="#">'+ x +'</a>' +  tree(data[x])+ ' </li>\n';
      }
      
       ostring += '</ul>';
      
      return ostring;
      
    } else {       
           var ostring = '<ul>\n';
      
     
      
        ostring += '<li> <a href="#">'+ data +'</a>'+ ' </li>\n';
     
      
       ostring += '</ul>';
      
      return ostring;
    }
}

function loadDbTree( name , dbObject ){

  var obj = {};
  obj[name] = dbObject;


  var t =  tree( obj );

  $('#tree').html( t );
   //$( 'body' ).append( holder );
   

  //console.log( tree );
  //$( '#sidebar' ).html('');
 // $( '#sidebar' ).append( holder );

}


loadDbTree( 'database' , [{ dude: "where" , "thing" : { "name" : "yo" } }, {my : "car"}] );