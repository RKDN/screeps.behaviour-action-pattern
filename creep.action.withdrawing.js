var action = new Creep.Action('withdrawing');
action.maxPerTarget = 2;
action.isValidAction = function(creep){
    return ( 
        creep.room.storage && 
        creep.room.storage.store.energy > 0  && 
        _.sum(creep.carry) < creep.carryCapacity && 
        (!creep.room.conserveForDefense || creep.room.relativeEnergyAvailable < 0.8)
    );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.store != null) && (target.store.energy > 0) );
};  
action.newTarget = function(creep){
    return creep.room.storage;
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9738), SAY_PUBLIC); 
};
module.exports = action;
