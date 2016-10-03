var setup = new Creep.Setup('privateer');
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.sortedParts = false;
setup.measureByHome = true;
setup.default = {
    fixedBody: [WORK, WORK, CARRY, CARRY, MOVE, MOVE], 
    multiBody: [WORK, CARRY, MOVE], 
    minAbsEnergyAvailable: 400, 
    minEnergyAvailable: 0.8,
    maxMulti: 8,
    maxWeight: (room) => room.privateerMaxWeight
};
setup.RCL = {
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;