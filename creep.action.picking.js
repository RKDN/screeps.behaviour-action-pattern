var action = new Creep.Action('picking');
action.maxPerAction = 4;
action.maxPerTarget = 2;
action.isValidAction = function(creep){
    return ( _.sum(creep.carry) < creep.carryCapacity );
};
action.isValidTarget = function(target){
    return (target != null && target.amount != null && target.amount > 0);
};   
action.isAddableTarget = function(target){
    return (!target.targetOf || ( 
        target.targetOf.length < this.maxPerTarget) && 
        target.amount > _.sum( target.targetOf.map( t => ( t.actionName == 'picking' ? t.carryCapacityLeft : 0 ))));
};
action.newTarget = function(creep){
    let target;
    if( creep.room.situation.invasion ) {
        // pickup near sources only
        if( target == null ) target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
            filter: (o) => this.isAddableTarget(o, creep) && o.pos.findInRange(creep.room.sources, 1).length > 0
        });
    } else {
        target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (o) => ( o.resourceType != RESOURCE_ENERGY && this.isAddableTarget(o, creep))
        });
        
        if( target == null ) target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
            filter: (o) => this.isAddableTarget(o, creep)
        });
    }
    return target;
};
action.work = function(creep){
    var result = creep.pickup(creep.target);
    if( result == OK ){
        // unregister
        creep.data.actionName = null;
        creep.data.targetId = null;
    }
    return result;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8681), SAY_PUBLIC); 
};
module.exports = action;