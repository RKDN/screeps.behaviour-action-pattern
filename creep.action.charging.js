var action = new Creep.Action('charging'); // store into container
action.renewTarget = false;
action.isValidAction = function(creep){ return creep.carry.energy > 0; }
action.isAddableAction = function(creep){ return true; }
action.isValidTarget = function(target){
    return ( target && 
        (( target.structureType == 'container' && (_.sum(target.store) < target.storeCapacity) ) ||
        ( target.structureType == 'link' && target.energy < target.storeCapacity * 0.85 )));
};   
action.isAddableTarget = function(target, creep){
    return (
        (target instanceof OwnedStructure && target.my) || 
        ( 
            (!creep.room.controller || 
                (
                    (!creep.room.controller.owner || creep.room.controller.my) && 
                    (!creep.room.controller.reservation || creep.room.controller.reservation.username == creep.owner.username) 
                )
            )
        )
    ) && (
        (target.structureType == 'container' && (target.storeCapacity - _.sum(target.store)) > Math.min(creep.carry.energy, 500)) ||
        ( target.structureType == 'link' )
    );
};
action.newTarget = function(creep){
    // if storage link is not full & controller link < 15% => charge
    if( creep.room.linksStorage.length > 0 ){
        
        let linkStorage = creep.room.linksStorage.find(l => l.energy < l.energyCapacity * 0.85);
        if( linkStorage ){
            let emptyControllerLink = creep.room.linksController.find(l => l.energy < l.energyCapacity * 0.15);
            if( emptyControllerLink )
                return linkStorage;
        }
    }

    var that = this;
    if( creep.room.containerOut.length > 0 ) {
        let target = null;
        let maxFree = 0; 
        var emptyest = o => {
            if( !that.isAddableTarget(o, creep) ) return;
            let free = o.storeCapacity - _.sum(o.store);
            if( free > maxFree ){
                maxFree = free;
                target = o;
            }
        };
        _.forEach(creep.room.containerOut, emptyest);
        return target;
    } 
};
action.work = function(creep){
    var workResult;
    if( creep.target.structureType == 'container' ) {
        for(var resourceType in creep.carry) {
            if( creep.carry[resourceType] > 0 ){
                workResult = creep.transfer(creep.target, resourceType);
                if( workResult != OK ) break;
            }
        }
    } else if( creep.target.structureType == 'link' ) {
        workResult = creep.transfer(creep.target, RESOURCE_ENERGY);;
    }
    return workResult;
};
module.exports = action;