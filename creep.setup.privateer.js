var setup = new Creep.Setup('privateer');
setup.multiBody = [WORK, CARRY, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.sortedParts = false;
setup.measureByHome = true;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxWeight = function(spawn){
    if (spawn.room.situation.invasion) return 0;  // Do not create in the middle of a fight
    if (setup.ShouldWeConserveForDefense(spawn)) return 0;
    return spawn.room.privateerMaxWeight;

}
module.exports = setup;