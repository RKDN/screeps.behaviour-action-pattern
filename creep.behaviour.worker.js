module.exports = {
    name: 'worker',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            creep.data.moveMode = null;
            delete creep.data.path;
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep){
        let priority;
        if( creep.carry.energy == 0 ) { 
            priority = [
                Creep.action.picking,
                Creep.action.withdrawing, 
                Creep.action.uncharging, 
                Creep.action.harvesting, 
                Creep.action.idle];

            if (!this.doWeHaveEnoughToWidral(creep)) {
                priority.splice(1, 1);
            }
        }    
        else {                
            if( creep.room.situation.invasion ){
                priority = [
                    Creep.action.picking,
                    Creep.action.fueling, 
                    Creep.action.feeding, 
                    Creep.action.repairing, 
                    Creep.action.idle];
            } else {
                priority = [
                    Creep.action.picking,
                    Creep.action.repairing, 
                    Creep.action.feeding, 
                    Creep.action.building, 
                    Creep.action.fueling, 
                    Creep.action.upgrading, 
                    Creep.action.idle];
            }
            if( creep.room.controller && creep.room.controller.ticksToDowngrade < 2000 ) { // urgent upgrading 
                priority.unshift(Creep.action.upgrading);
            }
        }
        if( _.sum(creep.carry) > creep.carry.energy ) {
            priority.unshift(Creep.action.storing);
        }
        for(var iAction = 0; iAction < priority.length; iAction++) {
            var action = priority[iAction];
            if(action.isValidAction(creep) && 
                action.isAddableAction(creep) && 
                action.assign(creep)) {
                    return;
            }
        }
    },
    doWeHaveEnoughToWidral: function(creep){

        if (SPAWN_DEFENSE_ON_ATTACK) {
            let storeNeeded = (Creep.setup.melee.maxCost() + Creep.setup.ranger.maxCost()) * 1;
            storeNeeded += storeNeeded * 0.50; // Add buffer
            if (!creep.room.storage || creep.room.storage.store.energy < storeNeeded) {
                return false;
            }
            else
                return true;
        }
        else
            return true;
    }
}
