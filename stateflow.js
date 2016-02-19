var fs = require('fs');
var Guid = require('guid');

var statemap;
var states;

fs.readFile(process.argv[2], 'utf8', function (err, data) {
  if (err) throw err;
    statemap = JSON.parse(data);
    states = statemap.states;


    processStartState(generateStartState(states), done, {activityId: Guid.create().value, currentState: '', attributes: {}});
    function done() {
	console.log("done");
    }
    
    
});



function generateNextState(state, cb, activity) {
    if (state.state.type == 'end') {
	processEndState(state, cb, activity);
    }
    else {
	processNextState(
	    findStateById (
		states,
		state.state.nextstates[getRandomInt(0, state.state.nextstates.length)].state
	    )[0], cb, activity
	);
    }
    
}

function processStartState(state, cb, activity) {


    if (state.state.onentry) {
	if (state.state.onentry.assign) {
	    generateNextState(state, cb, processAssignments(state, activity));
	    
	}
	else {
	    generateNextState(state, cb, 
			      {
				  activityId: activity.activityId,
				  currentState: state.state.shortdesc,
				  attributes: activity.attributes
			      }
			     );
	}
	
    }
    else {
	generateNextState(state, cb, 
			  {
			      activityId: activity.activityId,
			      currentState: state.state.shortdesc,
			      attributes: activity.attributes
			  }
			 );
	
    }
	
}

function evalExpr(expr) {
    var funcName = expr.match(/(.*)\(/);
    var args = expr.match(/.*\((.*)\)/);
    var functionName = funcName[1];
    
    if (functionName.match(/_dep/) ) {
//	console.log("it is dep function... NOT SUPPORTED YET");
	return ("NOT SUPPORTED");
    }
    else {
//	console.log("it is NOT dep function");
	return (eval(expr));
    }
}

function random_lookup_one(arg1) { 
    return random_lookup_many(1,1, arg1);
    
}
function random_lookup_many(num1, num2, arg1) {
    return base_random_lookup_many(num1, num2, arg1);
    
}


function base_random_lookup_many(num1, num2, qstring) {

    return (qstring);
    
}



function processAssignments (state, activity) {

    var nwattrs = activity.attributes;
    
    state.state.onentry.assign.forEach(function (e) {
	nwattrs[e.name] = evalExpr(e.expr);
    });
    
    return {
	activityId: activity.activityId,
	currentState: state.state.shortdesc,
	attributes: nwattrs
    }
}
function processNextState(state, cb, activity) {
    console.log(activity);


    
    if (state.state.onentry) {
	if (state.state.onentry.assign) {
	    generateNextState(state, cb, processAssignments(state, activity));
	    
	}
	else {
	    generateNextState(state, cb, 
			      {
				  activityId: activity.activityId,
				  currentState: state.state.shortdesc,
				  attributes: activity.attributes
			      }
			     );
	}
	
    }
    else {
	generateNextState(state, cb, 
			  {
			      activityId: activity.activityId,
			      currentState: state.state.shortdesc,
			      attributes: activity.attributes
			  }
			 );
	
    }

}

function processEndState(state, cb, activity) {
        console.log(activity);
    cb();
}

function generateStartState (states) {
    return (findStartState (findStatesByType(states, "start"), getRandomInt(0, findStatesByType(states, "start").length)));
    function findStartState (array, index) {
	return array[index];
    }
}

function findStatesByType(states, type) {
    return states.filter(function (element, index, array) {
	return (element.state.type == type);
    });
    
}
    
function findStateById(states, id) {
    return states.filter(function (element, index, array) {
	return (element.state.id == id);
    });
    
}
    
    

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
