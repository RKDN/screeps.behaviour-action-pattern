var action = new Creep.Action('uncharging'); // get from container
action.isAddableAction = function(creep){ return true; }
action.isAddableTarget = function(target){ return true;}
action.isValidAction = function(creep){ return _.sum(creep.carry) < creep.carryCapacity; }
action.isValidTarget = function(target){
    return ( target && target.store && target.store.energy > 0 );
};   
action.newTarget = function(creep){
    var that = this;
    let isAddable = target => that.isValidTarget(target);    
    if( ['hauler', 'worker'].includes(creep.data.creepType) && creep.room.chargeablesIn.length > 0 && creep.room.chargeablesOut.length > 0 ) {
        // take from fullest IN container having energy
        let target = null;
        let energy = 0;
        let fullest = cont => {
            let e = cont.targetOf ? 
                cont.store.energy - _.sum( cont.targetOf.map( t => ( t.actionName == 'uncharging' ? t.carryCapacityLeft : 0 ))) : 
                cont.store.energy;
            if( e  > energy ){
                energy = e ;
                target = cont;
            }
        };
        _.forEach(creep.room.chargeablesIn, fullest);
        return target;
    } else if( creep.data.creepType == 'upgrader' && creep.room.chargeablesIn.length > 0 && creep.room.chargeablesOut.length > 0 ) {
        // take from OUT container
        return creep.pos.findClosestByRange(creep.room.chargeablesOut, {
            filter: isAddable
        });
    } else {
        // take from any container
        return creep.pos.findClosestByRange(creep.room.chargeables, {
            filter: isAddable
        });
    } 
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
module.exports = action;