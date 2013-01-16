// Ovalize

// turn every selected path into an oval.
// you can specify the number of the anchor points.

// JavaScript Script for Adobe Illustrator CSx

// This script provided "as is" without warranty of any kind.
// Free to use and distribute.

// 2013-01-16

// Copyright(c) 2013 Hiroyuki Sato (sh)
// https://github.com/shspage

const SCRIPTNAME = "Ovalize";
const MPI = Math.PI;
const HPI = MPI / 2;
const WPI = MPI * 2;

main();
function main(){
  // setting ----------------------------
  
  var number_of_anchors = 4; // (default value for prompt)
  var show_prompt = true; // use default "number_of_anchors" if false
  
  //-------------------------------------
  
  if (documents.length < 1){
    return;
  }
  
  var paths = [];
  getPathItemsInSelection( 1, paths );
  if( paths.length < 1 ){
    alert(SCRIPTNAME + ": Please select Path(s) and run this script again.");
    return;
  }
  
  if( show_prompt ){
    // specify the number of the anchor points
    number_of_anchors = prompt(SCRIPTNAME + ": number of anchors", number_of_anchors);
    if( !number_of_anchors ){
      return;
    } else if( isNaN( number_of_anchors )
     || number_of_anchors < 2 ){
      alert(SCRIPTNAME + ": Invalid parameter (" + number_of_anchors + ")");
      return;
    }
    number_of_anchors = parseInt( number_of_anchors );
  }

  for( var i = 0; i < paths.length; i++ ){
    drawCircle( paths[i], number_of_anchors );
  }
}

// ------------------------------------------------
function drawCircle( path, number_of_anchors ){
  var original_width = path.width - path.strokeWidth;
  var original_height = path.height - path.strokeWidth;
  var center = getCenterPoint(path);

  var diameter = Math.max( original_width, original_height );
  var radius = diameter / 2;

  var handle_length, theta;

  // calc the length of the handle
  if(number_of_anchors == 2){
    handle_length = radius * 4 / 3;
    theta = MPI;
  } else {
    theta = WPI / number_of_anchors;
    handle_length = radius * 4 / 3 * (1 - Math.cos(theta / 2)) / Math.sin(theta / 2);
  }

  // draw a circle
  var pp, t;
  var p = new Point(0, 0);
  var pps = []; // array of vPathPoint

  for( var i = 0; i < number_of_anchors; i++ ){
    pp = new vPathPoint();
    
    t = theta * i + HPI;

    p.set( Math.cos(t), Math.sin(t) );
      
    pp.anchor.set( p.x * radius, p.y * radius );
      
    p.mul( handle_length, handle_length );
      
    pp.rightDirection.set( pp.anchor.x - p.y, pp.anchor.y + p.x );
    pp.leftDirection.set( pp.anchor.x + p.y, pp.anchor.y - p.x );

    pps.push( pp );
  }

  applyVpps( path, pps, true );

  path.resize( original_width * 100 / diameter, original_height * 100 / diameter);
  path.translate( center.x, center.y );
}

// ------------------------------------------------
function Point(x, y){
  this.x = x;
  this.y = y;

  this.set = function( x, y ){
    this.x = x;
    this.y = y;
    return this;
  };

  this.add = function( a, b ){
    this.x += a;
    this.y += b;
    return this;
  };

  this.mul = function( a, b ){
    this.x *= a;
    this.y *= b;
    return this;
  };

  this.toArray = function(){
    return [this.x, this.y];
  };
}

// ------------------------------------------------
function vPathPoint(){ // virtual PathPoint
  this.anchor = new Point(0, 0);
  this.rightDirection = new Point(0, 0);
  this.leftDirection = new Point(0, 0);

  this.apply = function( pt ){ // PathPoint
    pt.anchor = this.anchor.toArray();
    pt.rightDirection = this.rightDirection.toArray();
    pt.leftDirection = this.leftDirection.toArray()
  }
}

// ------------------------------------------------
function applyVpps( path, vpps, closed ){
  for( var i = path.pathPoints.length - 1; i > 0; i-- ){
    path.pathPoints[i].remove();
  }
  
  var pt;
  for( var i = 0; i < vpps.length; i++ ){
    pt = i == 0 ? path.pathPoints[0] : path.pathPoints.add();
    vpps[i].apply( pt );
  }

  path.closed = closed;
}

// ------------------------------------------------
function getCenterPoint( path ){
  var gb = path.geometricBounds; // left, top, right, bottom
  return new Point((gb[0] + gb[2]) / 2, (gb[1] + gb[3]) / 2);
}

// ------------------------------------------------
// extract PathItems from the selection which the length of
// PathPoints is greater than "min_pathpoint_count"
function getPathItemsInSelection( min_pathpoint_count, paths ){
  if(documents.length < 1) return;
  
  var selected_items = activeDocument.selection;
  
  if (!(selected_items instanceof Array)
      || selected_items.length < 1) return;

  extractPaths(selected_items, min_pathpoint_count, paths);
}

// --------------------------------------
// extract PathItems from "items" (Array of PageItems -- ex. selection),
// and put them into an Array "paths".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoint count is greater
// than this number.
function extractPaths(items, pp_length_limit, paths){  
  for( var i = 0; i < items.length; i++ ){
    // ignore guides and clipping paths
    if( items[i].typename == "PathItem"
        && !items[i].guides
        && !items[i].clipping ){
      if( pp_length_limit
         && items[i].pathPoints.length <= pp_length_limit ){
        continue;
      }
      paths.push( items[i] );
      
    } else if( items[i].typename == "GroupItem" ){
      // search PathItems in the GroupItem, recursively
      extractPaths( items[i].pageItems, pp_length_limit, paths );
      
    } else if( items[i].typename == "CompoundPathItem" ){
      // search Pathitems in the CompoundPathItem, recursively
      // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
      extractPaths( items[i].pathItems, pp_length_limit , paths );
    }
  }
}