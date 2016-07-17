var setup = new MODULES.creep.Setup();

setup.type = 'melee';
setup.body = [HEAL, MOVE]; 
setup.defaultBodyCosts = 300;
setup.maxMulti = 3;
setup.globalMeasurement = true;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, {'color': FLAG_COLOR.defense }).length;
}
setup.maxWeight = function(spawn){
    return 1000;
}

module.exports = setup;