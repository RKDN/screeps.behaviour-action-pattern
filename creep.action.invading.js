var action = new Creep.Action('invading');
action.isValidAction = function(creep){ return FlagDir.hasInvasionFlag(); };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.getFlaggedStructure = function(flagColor){
    var flags = _.filter(Game.flags, flagColor.filter); // TODO: find nearest (in room or count rooms?)
    var target = null;
    for( var iFlag = 0; iFlag < flags.length; iFlag++ ){
        var flag = flags[iFlag];
        if( flag.room !== undefined ){ // room is visible
            var targets = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos.x, flag.pos.y);
            if( targets && targets.length > 0)
                return targets[0]; // prefer target in same room so return
            else { // remove flag. try next flag
                flag.remove();
            }
        }
        else target = flag; // target in other room
    }
    return target;
}
action.newTarget = function(creep){
    var destroyFlag = this.getFlaggedStructure(FLAG_COLOR.destroy);
    if( destroyFlag ) {
        Population.registerCreepFlag(creep, destroyFlag);
        return destroyFlag;
    }        
    // move to invasion room
    var flag = FlagDir.find(FLAG_COLOR.invade, creep.pos);
    if( flag && (!flag.room || flag.pos.roomName != creep.pos.roomName)){
        Population.registerCreepFlag(creep, flag);
        return flag; // other room    
    }
    if( !flag ){
        // unregister 
        creep.action = null;
        return;
    }
    if( !flag.room.controller || !flag.room.controller.my ) {        
        //attack healer
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: function(hostile){ return _.some(hostile.body, {'type': HEAL}); } 
        });
        if( target ) 
            return target;
        //attack attacker
        target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: function(hostile){ return _.some(hostile.body, function(part){return part.type == ATTACK || part.type == RANGED_ATTACK}); } 
        });
        if( target ) 
            return target;
        // attack tower
        target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_TOWER;
            }
        });
        if( target ) 
            return target;
        // attack remaining creeps
        target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if( target ) 
            return target;        
        // attack spawn
        target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        if( target ) 
            return target;        
        // attack structures
        target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType != STRUCTURE_CONTROLLER;
            }
        });
        if( target ) 
            return target;        
        // attack construction sites
        target = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
        if( target ) 
            return target;
    }
    // no target found
    flag.remove();    
    return null;
};
action.step = function(creep){
    if(CHATTY) creep.say(this.name);
    if( creep.target.color && (creep.target.pos.roomName == creep.pos.roomName))
        this.newTarget(creep);
    this.run[creep.data.creepType](creep);
}
action.run = {
    melee: function(creep){        
        if( creep.target.color ){
            creep.drive( creep.target.pos, 0, 1, Infinity);
            return;
        }        
        var moveResult = creep.moveTo(creep.target, {reusePath: 0});
        if( !creep.target.my )
            var workResult = creep.attack(creep.target);
    }, 
    ranger: function(creep){     
        if( creep.target.color ){
            creep.drive( creep.target.pos, 0, 1, Infinity);
            return;
        }
        var range = creep.pos.getRangeTo(creep.target);
        if( range > 3 ){
            creep.moveTo(creep.target, {reusePath: 0});
        }
        if( range < 3 ){
            creep.move(creep.target.pos.getDirectionTo(creep));
        }        
        // attack
        var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if(targets.length > 2) { // TODO: calc damage dealt
            if(CHATTY) creep.say('MassAttack');
            creep.rangedMassAttack();
            return;
        }
        if( range < 4 ) {
            creep.rangedAttack(creep.target);
            return;
        }
        if(targets.length > 0){
            creep.rangedAttack(targets[0]);
        }
    }
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9876), SAY_PUBLIC); 
};
module.exports = action;