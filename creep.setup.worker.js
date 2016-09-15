var setup = new Creep.Setup('worker');
setup.multiBody = [CARRY, WORK, MOVE];
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 8;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.3;
};
setup.maxCount = function(spawn){
    if (spawn.room.situation.invasion) return 0;  
    if (setup.ShouldWeConserveForDefense(spawn)) return 0;
    return 5;
};
setup.maxWeight = function(spawn){
    return 1200;
};
module.exports = setup;
