var gallery_arr = new Array();

$(document).ready(function () { //jquery      
/* Check if we are in edit mode and the required modules are available and then customize the toolbar */
if ( $.inArray( mw.config.get( 'wgAction' ), ['edit', 'submit'] ) !== -1 ) {
	mw.loader.using( 'user.options', function () {
		if ( mw.user.options.get('usebetatoolbar') ) {
	    	mw.loader.using( 'ext.wikiEditor.toolbar', function () { createUpload(true); });
		}else{ createUpload(false); }
	});
}
});

function createUpload(wikiEditor){
		
		//create upload button
		var upload_button = $(document.createElement("div")).attr('id',"upload_select");
    	var upload_container = $(document.createElement("div")).attr({ 
      			id: "upload_container",
      			title: mw.msg('msu-button_title'),
      			'class': 'start-loading'
     	}).append(upload_button);
      
		if(wikiEditor==true){		
			//insert upload button
			var upload_tab = $(document.createElement("div")).attr('class','group ').appendTo('#wikiEditor-ui-toolbar .toolbar');
			upload_container.appendTo(upload_tab);
			//create upload div  
			var upload_div = $(document.createElement("div")).attr("id","upload_div").insertAfter('#wikiEditor-ui-toolbar'); 
			$('#wikiEditor-ui-toolbar .tool .options').css('z-index', '2'); //headline dropdown		
		}else{ //only standard editor
	      upload_container.css('display','inline-block').css('vertical-align', 'middle').appendTo("#toolbar"); 
	      upload_button.addClass('old_button');
		  var upload_div = $(document.createElement("div")).attr("id","upload_div").insertAfter("#toolbar"); 
		} 
		
		var status_div = $(document.createElement("div")).attr("id","upload_status").html('No runtime found.').appendTo(upload_div); 
	    var upload_list = $(document.createElement("ul")).attr("id","upload_list").appendTo(upload_div);
	    var bottom_div = $(document.createElement("div")).attr("id","upload_bottom").appendTo(upload_div).hide(); 
	    var start_button = $(document.createElement("a")).attr("id","upload_files").appendTo(bottom_div).hide();
	    var spacer1 = $(document.createElement("span")).attr("class", "spacer").appendTo(bottom_div).hide();
    	var clean_all = $(document.createElement("a")).attr("id","clean_all").text(mw.msg('msu-clean_all')).appendTo(bottom_div).hide();	
		var spacer2 = $(document.createElement("span")).attr("class", "spacer").appendTo(bottom_div).hide();
		var gallery_insert = $(document.createElement("a")).attr("id","gallery_insert").appendTo(bottom_div).hide();
		
        var uploader = new plupload.Uploader({
    		runtimes : 'html5,flash,silverlight,html4',
    		browse_button : 'upload_select',
    		container : 'upload_container',
    		max_file_size : '100mb',
    		drop_element: 'upload_drop',
    		//unique_names: true,  
    		//multipart: false, //evtl i
        	url : msu_vars.path+'/../../api.php',
    		flash_swf_url : msu_vars.path+'/js/plupload/plupload.flash.swf',
    		silverlight_xap_url : msu_vars.path+'/js/plupload.silverlight.xap',
    		
    		//resize : {width : 320, height : 240, quality : 90}, //resize pictures

	     /* Specify what files to browse for
        filters : [
	            {title : "Image files", extensions : "jpg,gif,png"},
	            {title : "Zip files", extensions : "zip"}
        ], */	
    	});
    
    	uploader.bind('Init', function(up, params) {
    		
	    	upload_container.removeClass('start-loading');
    		status_div.html("<b>Debug</b> runtime: " + params.runtime + " drag/drop: "+ (!!up.features.dragdrop));
    		if(msu_vars.debugMode == 'false') status_div.hide(); //hide status if debug mode is disabled

    		if(up.features.dragdrop && msu_vars.dragdrop == "true"){
	        	
	        	var upload_drop = $(document.createElement("div")).attr("id","upload_drop").text(mw.msg('msu-dropzone')).insertAfter(status_div); 
	        	upload_drop.bind('dragover',function(event){
					   $(this).addClass('drop_over').css('padding','20px');
				}).bind('dragleave',function(event){
					   $(this).removeClass('drop_over').css('padding','0px');
				}).bind('drop',function(event){
					   $(this).removeClass('drop_over').css('padding','0px');
				});

	       	}else{
	       		upload_div.addClass('nodragdrop');
	       	} //if
    		
    	});


      uploader.bind('FilesAdded', function(up, files) {
      	$.each(files, function(i, file){
    			
    			//iOS6 by SLBoat
    			if ((navigator.platform == "iPad" || navigator.platform == "iPhone") && file.name.indexOf("image")>-1 && file.name.length<11){
					var heute=new Date(); 
					fileNameApple = navigator.platform+'_image_'+heute.getFullYear()+'-'+heute.getMonth()+'-'+heute.getDate()+'-'+heute.getTime(); //because each image is named "image.jpg" in iOS6
					file.name = fileNameApple+'_'+i+'.'+file.name.split('.').pop(); // image_Y-M-D_0.jpg
				}
    			file.li = $(document.createElement("li")).attr("id",file.id).attr("class","file").appendTo(upload_list);
	            
	            file.li.type = $(document.createElement("span")).attr("class","file-type").appendTo(file.li);
	            file.li.title = $(document.createElement("span")).attr("class","file-title").text(file.name).appendTo(file.li);
	            file.li.size = $(document.createElement("span")).attr("class","file-size").text(plupload.formatSize(file.size)).appendTo(file.li);
	            file.li.loading = $(document.createElement("span")).attr("class","file-loading").appendTo(file.li);
	            file.li.warning = $(document.createElement("span")).attr("class","file-warning").appendTo(file.li);
	            
	            check_extension(file,up); 
                
                // moegirl-special FilesAdded (after check_extension)
                file.li.special = $('<div class="morgirl-special"></div>').appendTo(file.li);
                file.li.special.author = $('<label><span>&lt;作者&gt;</span><input class="mgs-author" /></label>').appendTo(file.li.special);
                file.li.special.source = $('<label><span>&lt;源地址&gt;</span><input class="mgs-source" /></label>').appendTo(file.li.special);
                // /moegirl-special FilesAdded (after check_extension)
    		});

    		up.refresh(); // Reposition Flash/Silverlight
    	});
	
     	uploader.bind('QueueChanged', function(up) {
		uploader.trigger("CheckFiles", up);
     });
      
    uploader.bind('StateChanged', function(up) {
		if(msu_vars.debugMode == 'true') console.log(up.state);
		
		if (up.files.length === (up.total.uploaded + up.total.failed)) {
			//console.log('state: '+up.files.length)// all files uploaded --> trigger
		}
	});
	
	uploader.bind('FilesRemoved', function(up,files) {
		if(msu_vars.debugMode == 'true') console.log('file removed');
		uploader.trigger("CheckFiles", up);
	});

    uploader.bind('BeforeUpload', function(up, file) {
    	   	
    	file.li.title.text(file.name).show(); //show title
    	$('#' + file.id + " input.input_change").hide(); //hide input
    	
    	up.settings.multipart_params = {
    		filename : file.name,
    		token: mw.user.tokens.get( 'editToken' ),
    		action:"upload",
    		ignorewarnings:true,
    		comment:mw.msg('msu-comment'),
    		format:"json"
    	}; //set multipart_params
    	$('#' + file.id + " div.file-progress-bar").progressbar({value: '1'});
    	$('#' + file.id + " span.file-progress-state").html("0%");
    	
        // moegirl-special BeforeUpload
        var comment = [],
            mgs_author = file.li.special.author.find('input').attr('readonly', true).val(),
            mgs_source = file.li.special.source.find('input').attr('readonly', true).val();
        comment.push('[[分类:', mw.config.get("wgPageName"), ']]');
        if (mgs_author) comment.push(' [[分类:作者:', mgs_author, ']]');
        if (mgs_source) comment.push(' 源地址:[', mgs_source, ']');
        
        up.settings.multipart_params.comment = comment.join('');
        // /moegirl-special BeforeUpload
        
     });
      
     uploader.bind('UploadProgress', function(up, file) {
    	
    		$('#' + file.id + " span.file-progress-state").html(file.percent + "%");
        	$('#' + file.id + " div.file-progress-bar").progressbar({value: file.percent});
      		$('#' + file.id + ' div.file-progress-bar .ui-progressbar-value').removeClass('ui-corner-left');
      });
   
     uploader.bind('Error', function(up, err) {
    		
        	$('#' + err.file.id + " span.file-warning")
        	.html("Error: " + err.code +", Message: " + err.message + (err.file ? ", File: " + err.file.name : ""));
        	
    		status_div.append(err.message);
    		up.refresh(); // Reposition Flash/Silverlight
     });
    
     uploader.bind('FileUploaded', function(up, file, success) {

		if(msu_vars.debugMode == 'true') console.log(success);
		
		file.li.title.unbind('click');
		file.li.title.unbind('mouseover');
			
        $('#' + file.id + " div.file-progress").fadeOut("slow");
        $('#' + file.id + " div.file-progress-bar").fadeOut("slow");
        $('#' + file.id + " span.file-progress-state").fadeOut("slow");
            
            
        // moegirl-special FileUploaded
        file.li.special.find('input').attr('readonly', false);
        // /moegirl-special FileUploaded
            
		try{
			result = jQuery.parseJSON( success.response );
			
			if(result.error){
				//{"servedby":"taken-alpha","error":{"code":"nofilename","info":"The filename parameter must be set"}}
				file_error(file,result.error.info);
				
			} else {
			
			//console.log(result.upload.result);
			/*{"upload":{"result":"Success",
						"filename":"Msupload_v8.4.jpg",
						"imageinfo":{
							"timestamp":"2012-02-28T14:52:05Z",
							"user":"L\u00fctz",
							"userid":4,
							"size":35491,
							"width":865,
							"height":292,
							"parsedcomment":"MsUpload",
							"comment":"MsUpload",
							"url":"...",
							"descriptionurl":"...",
							"sha1":"...",
							"metadata":...,
							"mime":"image\/jpeg",
							"mediatype":"BITMAP",
							"bitdepth":8
			}}}*/
			
            // moegirl-special FileUploaded
            file.li.special.slideUp("slow");
            // /moegirl-special FileUploaded
            
			file.li.type.addClass('ok');
            file.li.addClass('green');
            file.li.warning.fadeOut("slow");
            
    		if(file.kat == true){ //should the categroy be set?
		        
		         sajax_do_call( 'wfMsUploadSaveKat', [file.name,wgPageName],function (response) {
		             //alert(response.responseText);
		         });
		        
		     } //if
    		
    		$(document.createElement("a")).text(mw.msg('msu-insert_link')).click(function(e) { //click
  			    if(msu_vars.use_mslinks == 'true'){
  			    	mw.toolbar.insertTags( '{{#l:'+file.name+'}}', '', '', '' ); // insert link
  			    } else {
  			    	mw.toolbar.insertTags( '[[:File:'+file.name+']]', '', '', '' ); // insert link
  			    }
  			    
        	}).appendTo(file.li);
    		
            if (file.group == "pic"){
        		  
        		file.li.type.addClass('picture_load');
            	file.li.type.html('<img src="'+result.upload.imageinfo.url+'" height="18">');
        		gallery_arr.push(file.name);	

        		  		
        		  if(gallery_arr.length== 2){ //only at first time add click function
	        		  		gallery_insert.click(function(e) { //click
	  			
	  							console.log(gallery_arr);
	  							add_gallery(); //to take always the actual list

	        				}).text(mw.msg('msu-insert_gallery')).show();
	        				//spacer.show();
        		  } else if(gallery_arr.length< 2) {
        		  		
        		  	gallery_insert.html('');
        		  }

        		$(document.createElement("span")).text(' | ').appendTo(file.li);
        		$(document.createElement("a")).text(mw.msg('msu-insert_picture')).click(function(e) { //click
        			
        			mw.toolbar.insertTags( '[[File:'+file.name+(msu_vars.imgParams||'')+']]','','','');
        		
        		}).appendTo(file.li);
        		
                
        	} else if (file.group == "mov") { //mov  
        		  
        		
        		$(document.createElement("span")).text(' | ').appendTo(file.li);
        		$(document.createElement("a")).text(mw.msg('msu-insert_movie')).click(function(e) { //click

        			mw.toolbar.insertTags( '[[File:'+file.name+']]','','','');
        			
        		}).appendTo(file.li);

        	} //movie
        	
        	}//else error
        	
        }catch(e){//try
			
			file_error(file,"Error: " + success.response.replace(/(<([^>]+)>)/ig,"")); //remove html tags

		}
		
		up.removeFile(file); //for preventing a second upload afterwards
		
     });
     
	 uploader.bind('UploadComplete', function(up, files) { 
	 		
	    	uploader.trigger("CheckFiles", up);  //trigger --> state changed
	    	start_button.hide();

	 });
	 
    uploader.bind('CheckFiles', function(up) { 
	   	if(msu_vars.debugMode == 'true') console.log(up.files.length);

	    if(gallery_arr.length >= 2){ 
	    	spacer2.show();	
	    	gallery_insert.show();
	   	}else{
         	gallery_insert.hide();
         	spacer2.hide();	
	   	}
	   	
	    if (up.files.length==1){
        	start_button.text(mw.msg('msu-upload_this')).show();
        	spacer1.show();	
        } else if (up.files.length>1){
        	start_button.text(mw.msg('msu-upload_all')).show();
        	spacer1.show();	
      	
        } else { //0 files in list
         	start_button.hide();
         	spacer1.hide();	
         	if(gallery_arr.length < 2){ 
	    	//bottom_div.hide();
	    	}
         	
        }  

        if (up.files.length>0){
        	bottom_div.show();
	        clean_all.text(mw.msg('msu-clean_all')).click(function(e){
	        				
				
				gallery_arr.length = 0; // zurücksetzen
				
				if(up.files.length > 0) {
				//	bottom_div.hide();
					$.each(up.files, function(i, file){
						up.removeFile(file);
						up.refresh(); 
						//file.li.hide("slow");
					});
				}
				
				$('#upload_list .file').hide("slow");
				$(this).hide();
				bottom_div.hide();
				uploader.trigger("CheckFiles", uploader);
				gallery_insert.unbind('click');
				
	       	}).show();
       } 
       		
        up.refresh();
	 });
    	
    	
    	$('#upload_files').click(function(e) {
    		uploader.start();
    		e.preventDefault();
    	});
    	
    /*
    $('uploadfiles').onclick = function() {
          	uploader.start();
          	return false;
          };
        */
                
   uploader.init();

	

};//function

function add_gallery(){
	gallery_text = "Image:";
	gallery_text += gallery_arr.join("\nImage:");
	gallery_text +='\n';
	mw.toolbar.insertTags( '<gallery>\n\n'+gallery_text+'\n</gallery>\n', '', '', '' ); // insert gallery
}


function check_extension(file,uploader){
		if(msu_vars.debugMode == 'true') console.log(file);
		
        file.li.loading.show();
		file.extension = file.name.split('.').pop().toLowerCase();

		if($.inArray(file.extension, wgFileExtensions) != -1) {
		    
		    switch(file.extension) {

       	 	  case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'tif': case 'tiff': //pictures
       	 		file.group = "pic";
       	 		file.li.type.addClass('picture');
            	break;
			  case 'mov':
       	 		file.group = "mov";
       	 		file.li.type.addClass('film');
             	break;
        	  case 'pdf':
        	    file.li.type.addClass('pdf');
             	break;
    		}
    		
            check_file(file.name,file.li);
            
                   				
	        file.li.cancel = $(document.createElement("span")).attr("title",mw.msg('msu-cancel_upload')).click(function(e) {
	                file.li.fadeOut("slow");

	                if (file.group == "pic"){
					 	var idx = gallery_arr.indexOf(file.name); 	// Find the index
					 	if(idx!=-1) gallery_arr.splice(idx, 1); 	// Remove it if really found!
					 	uploader.trigger("CheckFiles", uploader); 	// If Picture is removed
        			}
        			uploader.removeFile(file);
        			uploader.refresh(); 
        			
	        }).attr("class","file-cancel").appendTo(file.li);
	            
            build(file); // alles aufbauen
            	

      } else { // wrong datatype
				
			file.li.loading.hide(1, function() { //create callback 
				uploader.removeFile(file);
				uploader.refresh();  	
			});

            file_error(file,mw.msg('msu-ext_not_allowed')+' '+wgFileExtensions.join(','));

      }//else
}

function check_file(filename,file_li){
		 	
          //file_li.warning.html("<img src='"+msu_vars.path+"/images/loading.png'>");
              		         
          sajax_do_call( 'SpecialUpload::ajaxGetExistsWarning', [filename], 
        		function (result) {
        				
        		warning = result.responseText.replace(/(<([^>]+)>)/ig,"");

        		if ( warning == '' || warning == '&nbsp;' || warning =='&#160;') {
        			
        			file_li.warning.text(mw.msg('msu-upload_possible')).removeClass('small_warn');
        			

        		} else {
        		
                	// errorhandling
                	warning_split = warning.split(". "); //split error
                	$(document.createElement("span")).attr("class","small_warn").text(warning_split[0]).click(function(e) {
                		$(this).text(warning_split[0]+'. '+warning_split[1]);
                	}).appendTo(file_li.warning);
             
                } //else
       			file_li.loading.hide();	
        	});
}

function file_error(file,error_text){
	
	file.li.warning.text(error_text);
    //file.li.type.addClass('document');
    file.li.addClass('yellow');
    file.li.type.addClass('error');
    
    file.li.click(function(e) { //bei klick li löschen
	   file.li.fadeOut("slow");
	})
	
	
}


function build(file){
   

      //fileindexer
      //if(autoIndex){
        	// new Element('input', {name:'fi['+file.id+']', 'class':'check_index',type: 'checkbox', 'checked': true}).inject(file.ui.title, 'after');
    	  //new Element('span', {'class':'check_span',html: 'Index erstellen'}).inject(file.ui.title, 'after'); 
      //}

      //autokat
      if(msu_vars.autoKat){
      	file.kat = false;
        if(wgNamespaceNumber==14){ //category page
        	
        	if(msu_vars.autoChecked=='true')  file.kat = true; //predefine

        	$(document.createElement("input")).attr({
        		'class':'check_index',	
        		type: 'checkbox',
        		'checked': file.kat
        	}).change(function(e) {
	        
	          file.kat = this.checked; // save
	        
	        }).appendTo(file.li);
    	  	
    	  	$(document.createElement("span")).attr("class","check_span").text(wgPageName.replace(/_/g, " ")).appendTo(file.li); 
   
        }
      } 
      
		
    	file.li.title.mouseover(function() { //mouseover
			$(this).addClass('title_over');
    	 }).mouseleave(function() {		//mouseout	
    		$(this).removeClass('title_over');
  		}).click(function(e) { //click
  			
  			$(this).hide();
  			var input_change = $(document.createElement("input")).attr({
	          'class':'input_change',
	          size:file.name.length,
	          //id: 'input_change-'+file.id,
	          name:'filename',
	          value:file.name
        	}).insertAfter($(this));  
        
	        input_change.change(function(e) {
	        
	          file.name = this.value; //neuen namen speichern
	          check_file(this.value,file.li);
	        
	        });
  			
  		});

    file.li.append('<div class="file-progress"><div class="file-progress-bar"></div><span class="file-progress-state"></span></div>'); 
    
}
