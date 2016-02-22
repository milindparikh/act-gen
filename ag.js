var fs = require('fs');
var Guid = require('guid');
var redis = require('redis');
var client = redis.createClient(); //creates a new client


var obj;
var statemap;
var states;

fs.readFile('mockinstructions.json', 'utf8', function (err, data) {
    if (err) throw err2;
    obj = JSON.parse(data);
    console.log(obj.agi.numberOfActivities);
    console.log(obj.agi.inSequenceOrParallel);
    console.log(obj.agi.demotime.createEventEveryNSeconds);

    fs.readFile(obj.agi.statemap, 'utf8', function (err2, data2) {
	if (err2) throw err2;
	statemap = JSON.parse(data2);
	states = statemap.states;

	var currentRun = Guid.create();
	
	function done(word) {
	    console.log(word);
	    client.quit();
	}
	startEventTriggering(currentRun, 0, obj.agi.numberOfActivities, done);
    });
});



function  startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb) {
    setTimeout(function() {
	if (shouldEventCreateActivity (currentRun, currentActivityCount, totalActivityCount)) {
	    createActivity(currentRun, currentActivityCount, totalActivityCount, cb);
	}
	else {
	    processActivity(currentRun, currentActivityCount, totalActivityCount, cb);
	}
    }, obj.agi.demotime.createEventEveryNSeconds);
    
}






function endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) {
    client.scard("run:"+currentRun, function (err, reply) {
	if (currentActivityCount < totalActivityCount ) {
	    startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb);
	}
	else {
	    if (reply == 0) {
		cb("done");
	    }
	    else {
		startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb);
	    }
	}
	
    });
}


function createActivity (currentRun, currentActivityCount, totalActivityCount, cb)  {
    (function (activityId) {startActivity(activityId);}(Guid.create()));
    function startActivity(activityId) {
	var startState = generateStartState(states);
	client.sadd("run:"+currentRun, activityId.value, function (err,reply) {
	    client.sadd("activity:"+activityId.value+":currentState", JSON.stringify(startState), function (err2, reply2) {
		var currentObj = {activityId: activityId.value, currentState: startState.state.shortdesc, attributes: {}};
		processActivityWithNextState(currentRun, currentActivityCount+1, totalActivityCount, cb, activityId.value, currentObj, startState) ;

	    });
	});
    }
}

function processActivity(currentRun, currentActivityCount, totalActivityCount, cb) {
    client.srandmember("run:"+currentRun, function (err, reply) {
	if (reply === null) {
	    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
 	}
	else {
	    client.spop("activity:"+reply+":currentState", function (err2, reply2) {
		client.spop("activity:"+reply+":currentObj", function (err5, sCurrentObj) {

		    currentState = JSON.parse(reply2);
		    var nextState = generateNextState(currentState);
		    currentObj = JSON.parse(sCurrentObj);
		    console.log(sCurrentObj);
		    
		    if (nextState === null) {
			client.srem("run:"+currentRun, reply, function (err3, reply3) {
			    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
			});
		    }
		    else {
			client.sadd("activity:"+reply+":currentState", JSON.stringify(nextState), function (err4, reply4) {

			    processActivityWithNextState(currentRun, currentActivityCount, totalActivityCount, cb, reply, currentObj, nextState);
			});
		    }
		});	   

	    });
	}
    });
}



function processActivityWithNextState(currentRun, currentActivityCount, totalActivityCount, cb, activityId, currentObj, currentState) {

    if (currentState.state.onentry) {
	if (currentState.state.onentry.assign) {
	    processAssignmentsWithNextState (currentRun, currentActivityCount, totalActivityCount, cb, currentObj, currentState);
	}
	else {
	    processStateChangeWithNextState (currentRun, currentActivityCount, totalActivityCount, cb, currentObj, currentState) ;
	}
    }
    else {
	processStateChangeWithNextState (currentRun, currentActivityCount, totalActivityCount, cb, currentObj, currentState) ;
    }
    
}


function processAssignmentsWithNextState (currentRun, currentActivityCount, totalActivityCount, cb, currentObj, currentState) {
    var numAttribs = 0;
    currentState.state.onentry.assign.forEach(function (e) {
	processNameExpressionPair(e.name, e.expr);
    });
    
    function assignNameValueToCurrentObj(name, value) {
	currentObj.attributes[name] = value;
	numAttribs++;
	if (numAttribs == currentState.state.onentry.assign.length) {
	    processStateChangeWithNextState (currentRun, currentActivityCount, totalActivityCount, cb, currentObj, currentState);
	}
    }

    
    function processNameExpressionPair(name, expr) {

	var funcName = expr.match(/(.*)\(/);
	var args = expr.match(/.*\((.*)\)/);
	var realArg = args[1].replace(/"/g, "");
	
	var functionName = funcName[1];
	
	if (functionName.match(/_dep/) ) {
	    assignNameValueToCurrentObj(name, 'NOT_SUPPORTED');

	}
	else {
	    if (functionName.match(/random_lookup_one/)) {
		random_lookup_one( args[1], realArg, name, assignNameValueToCurrentObj);
	    }
	    else {
		assignNameValueToCurrentObj(name, 'NOT_SUPPORTED');
	    }
	    
	}
	
	

	
    }
    

}


function processStateChangeWithNextState (currentRun, currentActivityCount, totalActivityCount, cb, currentObj, currentState) {
    client.sadd("activity:"+currentObj.activityId+":currentObj",
		JSON.stringify({activityId: currentObj.activityId,
				currentState: currentState.state.shortdesc,
				attributes: currentObj.attributes
			       }),
		function (err2, reply2) {
		    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
		});
}




function random_lookup_one(arg, arg1, name, cb) {
    
    random_lookup_many(1,1, arg, arg1, name, cb);
    
}
function random_lookup_many(num1, num2, arg, arg1, name, cb) {
    base_random_lookup_many(num1, num2, arg, arg1, name, cb);
    
}


function base_random_lookup_many(num1, num2, arg, entity, name, cb) {


    
    client.llen ("METADATA:"+entity, function (err, len) {
	client.lrange("METADATA:"+entity, 0, len, function (err2, metadata) {
	    client.get("total:"+entity+"S", function (err3, totalEntities) {
		
		if ( (len > 0 ) && ! (totalEntities === null) && (metadata.length > 0) ) {
		    var randomEntity = getRandomInt(0, totalEntities);
		    var ret = {};
		    numAttrs = 0;

		    function processev(e,v) {
			numAttrs++;
			ret[e] = v;
			
			if (numAttrs == metadata.length) {
			    cb(name, JSON.stringify(ret));
			}
		    }
		    
		    metadata.forEach ( function (e) {
			client.hget(entity+":"+randomEntity, e, function (err, value) {
			    processev(e, value);
			});
		    });
		}
		else {
		    cb(name, "NO DATA AVAILABLE");
		}
	    });
	    
	});
    });
    
}



function shouldEventCreateActivity (currentRun, currentActivityCount, totalActivityCount) {
    
    if (currentActivityCount == totalActivityCount ) {
	return false;
    }
    else {
	if  ( (currentActivityCount /  totalActivityCount) < 0.9) {   // less than 90% left
	    return true;
	}
	else {             // do a coin toss
	    if (getRandomInt(1, 100)/100 < (currentActivityCount /  totalActivityCount)) {
		return true;
	    }

	    else {
		return false;
	    }
	}
    }
}

function generateNextState(state) {

    
    if (state.state.type == 'end') {
	return null;
    }
    else {
	var nextState = 

	    findStateById (
		states,
		state.state.nextstates[getRandomInt(0, state.state.nextstates.length)].state
	    )[0];
	return nextState;
	
	
    }
    
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
