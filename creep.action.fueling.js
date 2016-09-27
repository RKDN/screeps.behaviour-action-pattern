var action = new Creep.Action('fueling');
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.isAddableTarget = function(target){
    return ( target.my && 
        (!target.targetOf || target.targetOf.length < this.maxPerTarget));
};
action.newTarget = function(creep){
    return creep.room.fuelables.length > 0 ? creep.room.fuelables[0] : null;
};
action.work = function(creep){
    let response = creep.transfer(creep.target, RESOURCE_ENERGY);
    if( creep.target.energyCapacity - creep.target.energy < 20 ) 
        creep.data.targetId = null;
    return response;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9981), SAY_PUBLIC); 
};
module.exports = action;