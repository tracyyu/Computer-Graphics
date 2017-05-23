// *******************************************************
// CS 174a Graphics Bee Assignment
// Tracy Yu 304008784
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  


"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), 1, 1, 1, 40, "" ) ); }


// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}



function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 0, 0, 1 );			// Background color

		self.m_triangle = new triangle( mat4() );
		self.m_spike = new spike( mat4() );
		self.m_tetrahedron = new tetrahedron( mat4() );
		self.m_windmill = new windmill( mat4() );
		self.m_pyramid = new pyramid( mat4() );
		self.m_cube = new cube();
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		self.m_capped_cylinder = new capped_cylinder( mat4() );

		self.ship_pos = vec3(0,0,0);

		self.m_house  = new Array(6);
		for (var k = 0; k < 6; k++)
		    self.m_house[k] = new cube();

		self.m_roof = new Array(6);
		for (var k = 0; k < 6; k++)
		    self.m_roof[k] = new pyramid( mat4());

		self.m_chimmney = new Array(6);
		for (var k = 0; k < 6; k++)
		    self.m_chimmney[k] = new cube();

		self.eye_position = vec3(0, 10, 350);
		self.at_position = vec3(0,0,0);
		self.up_position = vec3(0,1,0);
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translate(0, -5, -350), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );


		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.animation_time = 0;
		self.animation_delta_time = 0;
		self.animation_duration = 0;
		self.chooseAnim = 0;
		self.context.render();

	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here

Animation.prototype.init_keys = function()
{
/**
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
**/
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame

	}
        

Animation.prototype.drawMoon = function(model_transform)
{
	var earth = new Material( vec4( .5,.5,.5,1 ), 1.0, 1.1, 0.5, 40, "moon.jpg" );

	//var greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "/Users/tracyyu/Desktop/Both_templates/WebGL_Template/earth.gif");
	model_transform = mult( model_transform, translate(30, 150, -80 ));		
	model_transform = mult( model_transform, scale( 32, 32, 32));
	model_transform = mult( model_transform, rotate( -1*this.graphicsState.animation_time*3/200, 0, 1, 0 ) );
	this.m_sphere.draw( this.graphicsState, model_transform, earth);	
}

Animation.prototype.drawGround = function( model_transform )
{
	
	  	var ground = new Material( vec4( .5, .5, .5, 1 ), 1, 1, 0.2, 40, "dessert.jpg");	
		

		this.stack = [];

		this.stack.push( model_transform );
		model_transform = mult( model_transform, translate(0, 0, -1 ));						// Create the ground 
		model_transform = mult( model_transform, scale( 1000, 1, 1000 ));
		this.m_cube.draw( this.graphicsState, model_transform, ground );
		model_transform = this.stack.pop();

		this.stack.push( model_transform );
		this.drawMountain(model_transform);
		model_transform = this.stack.pop();

		this.stack.push(model_transform);
		this.drawMoon(model_transform);
		model_transform = this.stack.pop();
		
		this.stack.push( model_transform );
		this.populateHouse(model_transform);
		this.spikes(model_transform);
		model_transform = this.stack.pop();

		
}

Animation.prototype.drawMountain = function(model_transform)
{
	var mountain = new Material( vec4( .5, .5, .5, 1 ), 1, 1, 1, 40, "mountain.jpg");
	model_transform = mult( model_transform, translate( -30, 50, -300 ));
	for( var i = 0; i < 3; i++)
	{
		this.stack.push(model_transform);
		model_transform = mult( model_transform, translate((((i % 3 == 0) ? -i : i)*20)+(300-250),0,(((i % 2 == 0) ? -i : i)*20)+(250-130)));
		
		model_transform = mult( model_transform, scale( 50, 50, 50 ));
		this.m_pyramid.draw( this.graphicsState, model_transform, mountain );
		model_transform = this.stack.pop();
	}	

	model_transform = mult( model_transform, translate( -400, 0, 0 ));
	
	for( var i = 0; i < 2; i++)
	{

		this.stack.push(model_transform);
		model_transform = mult( model_transform, translate((((i % 11 == 0) ? -i : i)*40)+(500-250),0,(((i % 6 == 0) ? -i : i)*60)+(-130)));
		
		model_transform = mult( model_transform, scale( 50, 50, 50 ));
		this.m_pyramid.draw( this.graphicsState, model_transform, mountain );
		model_transform = this.stack.pop();
	}	

	var landscape = new Material( vec4( .5, .5, .5, 1 ), 1, 1, 1.5, 40, "mountain.jpg");	
	model_transform = mult( model_transform, translate( -50, -35, -80 ));
	
	for( var i = 0; i < 30; i++)
	{
		model_transform = mult( model_transform, translate(40,0,0));
		this.stack.push(model_transform);
		model_transform = mult( model_transform, scale( 40, 20, 40 ));
		this.m_pyramid.draw( this.graphicsState, model_transform, landscape );
		model_transform = this.stack.pop();

	}

}

Animation.prototype.drawSpaceship = function(model_transform)
{
	var greyPlastic = new Material( vec4( .4,.3,.5,1 ), 1, 1, 1, 40);
	var bluePlastic = new Material(vec4(.5,.6,.65,1 ), 1, 1, 0.2, 40);

	model_transform = mult( model_transform, translate(0, 50, 205 ));
	model_transform = mult( model_transform, translate(30*Math.sin(this.graphicsState.animation_time/1000), 2*Math.sin(this.graphicsState.animation_time/1000), 10*Math.sin(this.graphicsState.animation_time/1000)) );
	this.stack.push(model_transform);

	model_transform = mult( model_transform, translate(0, 1.5, 0 ));
	model_transform = mult( model_transform, scale(5, 3, 5 ));
	model_transform = mult( model_transform, rotate( -1*this.graphicsState.animation_time*3/200, 0, 1, 0 ) );
	this.m_sphere.draw( this.graphicsState, model_transform, bluePlastic );
	model_transform = this.stack.pop();

	
	this.stack.push(model_transform);
	model_transform = mult( model_transform, scale(5, 5, 5 ));	
	model_transform = mult( model_transform, rotate( -1*this.graphicsState.animation_time*3/200, 0, 1, 0 ) );	
	this.m_cylinder.draw( this.graphicsState, model_transform, bluePlastic );
	model_transform = this.stack.pop();

	this.stack.push(model_transform);
	model_transform = mult( model_transform, translate(0, -1.75, 0 ));
	model_transform = mult( model_transform, scale(6, 0.9, 6 ));	
	model_transform = mult( model_transform, rotate( -1*this.graphicsState.animation_time*9/200, 0, 1, 0 ) );	
	this.m_cylinder.draw( this.graphicsState, model_transform, greyPlastic );
	model_transform = this.stack.pop();	

	this.stack.push(model_transform);
	model_transform = mult( model_transform, translate(0, -2.5, 0 ));
	model_transform = mult( model_transform, scale(5, 1, 5 ));	
	model_transform = mult( model_transform, rotate( 90, 1, 0, 0 ) );
	this.m_fan.draw( this.graphicsState, model_transform, greyPlastic );
	//this.ship_pos = model_transform;
	model_transform = this.stack.pop();

	this.stack.push(model_transform);
	this.light(model_transform);
	model_transform = this.stack.pop();
	
	//this.ship_pos = model_transform;

	for( var i = 0; i < 3; i++ )												// Create legs on one side of the body
	{									
		for( var j = 0; j < 2; j++ )											// Create legs on the other side of the body
			this.drawLeg( model_transform, i, j );
	}

	this.dropBomb(model_transform);
}

Animation.prototype.getPos = function()
{
	return this.ship_pos;
}

Animation.prototype.drawLeg = function( model_transform, i, j )
{
	var greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20 );
	model_transform = mult( model_transform, translate( ((i % 2 == 0) ? 1 : -1), -3.5,  (j*0.2)* 1));
	model_transform = mult( model_transform, rotate( 90 ,0, 1, 0));							// add legs along the corner of bee body						
	model_transform = mult( model_transform, rotate( ((i % 2 == 0) ? -1 : 1) * 180/10 * Math.sin(this.graphicsState.animation_time * 1/1000),1, 0, 0));	// rotate top half legs at an angle			model_transform = mult( model_transform, translate(0, -0.5, 0.1));

	this.stack.push( model_transform );

	model_transform = mult( model_transform, scale( 0.5, 2, 0.5));
	this.m_cube.draw( this.graphicsState, model_transform, greyPlastic);

	model_transform = this.stack.pop();

	this.stack.push(model_transform);
	model_transform = mult( model_transform, translate(0, -0.75, 0));								// creates the bottom half of leg
	model_transform = mult( model_transform, rotate( ((i % 2 == 0) ? 1 : -1) * 180/4 * Math.sin(this.graphicsState.animation_time * 1/1000) ,1, 0, 0));		//  rotate leg at the same degree as top half of leg
	model_transform = mult( model_transform, scale( 0.5, 2, 0.5));
	model_transform = mult( model_transform, translate(0, -0.52, 0));
	this.m_cube.draw( this.graphicsState, model_transform, greyPlastic);
	model_transform = this.stack.pop();

}

Animation.prototype.spikes = function( model_transform)
{
	var greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20, "boulder.jpeg" );
	model_transform = mult( model_transform, translate(10, 1, 250));
	model_transform = mult( model_transform, scale(4, 4, 4 ));
	this.m_spike.draw( this.graphicsState, model_transform, greyPlastic );
}

Animation.prototype.dropBomb = function( model_transform)
{
	var greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20, "boulder.jpeg" );
	model_transform = mult( model_transform, scale(2, 2, 2 ));
	model_transform = mult( model_transform, translate( 0 , -0.001*this.graphicsState.animation_time, 0 ));
	this.m_spike.draw( this.graphicsState, model_transform, greyPlastic );
}

Animation.prototype.light = function(model_transform)
{
	var greyPlastic = new Material( vec4( .5,.5,.5,1 ), 0.5, 0.5, .5, 20 );
	model_transform = mult( model_transform, translate(0, -20, 0));
	model_transform = mult( model_transform, scale(5, 25, 5 ));
	this.m_pyramid.draw( this.graphicsState, model_transform, greyPlastic );
}

Animation.prototype.drawHouse = function(model_transform)
{
	var house = new Material( vec4( .5,.5,.5,1 ), 1, 0.5, 0.2, 40, "brick.jpg");
	model_transform = mult( model_transform, translate(0, -50, 300 ));
	this.stack.push(model_transform);


	model_transform = mult( model_transform, translate(0, 1.5, 0 ));
	model_transform = mult( model_transform, scale(10, 10, 10 ));
	this.m_cube.draw( this.graphicsState, model_transform, house );
	model_transform = this.stack.pop();

	this.stack.push(model_transform);
	var roof = new Material( vec4( .5,.5,.5,1 ), 1, 0.5, 0.2, 40, "roof.jpg");
	model_transform = mult( model_transform, translate(0, 9.4, 0 ));
	model_transform = mult( model_transform, scale(5.2, 3, 5.2 ));	
	this.m_pyramid.draw( this.graphicsState, model_transform, roof );

	var chimmney = new Material( vec4( .5,.5,.5,1 ), 1, 0.5, 0.2, 40, "roof.jpg");
	model_transform = mult( model_transform, translate(0.4, 0.5, -.2 ));
	model_transform = mult( model_transform, scale(0.4, 2, 0.4 ));
	this.m_cube.draw( this.graphicsState, model_transform, chimmney );
	model_transform = this.stack.pop();

}

Animation.prototype.populateHouse = function(model_transform)
{
	model_transform = mult( model_transform, translate(0,53,-70));
	for( var i = 1; i < 6; i++)
	{
		this.stack.push(model_transform);
		model_transform = mult( model_transform, translate( ((i % 2 == 0) ? i : -i) * 15, 0, -30));
		this.drawHouse(model_transform);
		model_transform = this.stack.pop();
	}
}


Animation.prototype.lighstOut = function( model_transform )
{
	var greyPlastic = new Material( vec4( 1, 1, 11,1 ), 1, 1.5, 1, 20 );
	model_transform = mult( model_transform, translate(0, 80., 200 ));
	model_transform = mult( model_transform, scale(50, 1, 50 ));
	this.m_sphere.draw( this.graphicsState, model_transform, greyPlastic );
}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(!animate) this.graphicsState.animation_time += this.animation_delta_time;
		    prev_time = time;     // Now happens in update_strings
		var animDone = false;
		var speed = 1/10;
		
		update_camera( this, this.animation_delta_time );
			
		this.basis_id = 0;
		
		var model_transform = mat4();

		/**********************************
		Start coding here!!!!
		**********************************/

		this.drawGround(model_transform);

		this.drawSpaceship(model_transform);

		this.graphicsState.camera_transform = lookAt(this.eye_position, this.at_position ,vec3(0,1,0));

		//this.eye_position[0] += this.animation_delta_time/1000;
			//this.graphicsState.camera_transform = mult( translate( 0,0, -1* this.animation_delta_time)/1000, this.graphicsState.camera_transform );

		var look = this.eye_position[2];
		var sky = this.eye_position[1];

		var at_side_x = this.eye_position[0];
		var at_side_z = this.eye_position[2];
		if( look > 228)
			this.eye_position[2] -= this.animation_delta_time/100;	

		if( look < 228 && sky < 10.0000005)
			this.at_position[1] += this.animation_delta_time/10;
	}	


Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
	debug_screen_object.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	//debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	//debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
	debug_screen_object.string_map["FPS"] = "FPS: " + Math.floor(1000 / this.animation_delta_time);
}