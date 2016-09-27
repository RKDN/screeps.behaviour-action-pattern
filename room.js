var mod = {
    extend: function(){
        Object.defineProperties(Room.prototype, {
            'sources': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.sources) ) {                        
                        this._sources = this.find(FIND_SOURCES);
                        if( this._sources.length > 0 ){
                            this.memory.sources = this._sources.map(s => s.id);
                        } else this.memory.sources = [];
                    }
                    if( _.isUndefined(this._sources) ){  
                        this._sources = [];
                        var addSource = id => { addById(this._sources, id); };
                        this.memory.sources.forEach(addSource);
                    }
                    return this._sources;
                }
            },
            'sourceAccessibleFields': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.sourceAccessibleFields)) {
                        let sourceAccessibleFields = 0;
                        let sources = this.sources;
                        var countAccess = source => sourceAccessibleFields += source.accessibleFields;
                        _.forEach(sources, countAccess);
                        this.memory.sourceAccessibleFields = sourceAccessibleFields;
                    }
                    return this.memory.sourceAccessibleFields;
                }
            },
            'sourceEnergyAvailable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._sourceEnergyAvailable) ){ 
                        this._sourceEnergyAvailable = 0;
                        var countEnergy = source => (this._sourceEnergyAvailable += source.energy);
                        _.forEach(this.sources, countEnergy);
                    }
                    return this._sourceEnergyAvailable;
                }
            },
            'ticksToNextRegeneration': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._ticksToNextRegeneration) ){
                        this._ticksToNextRegeneration = _(this.sources).map('ticksToRegeneration').min() || 0;
                    }
                    return this._ticksToNextRegeneration;
                }
            },
            'relativeEnergyAvailable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._relativeEnergyAvailable) ){  
                        this._relativeEnergyAvailable = this.energyCapacityAvailable > 0 ? this.energyAvailable / this.energyCapacityAvailable : 0;
                    }
                    return this._relativeEnergyAvailable;
                }
            },
            'spawns': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.spawns) ) {
                        this.saveSpawns();
                    }
                    if( _.isUndefined(this._spawns) ){ 
                        this._spawns = [];
                        var addSpawn = id => { addById(this._spawns, id); };
                        _.forEach(this.memory.spawns, addSpawn);
                    }
                    return this._spawns;
                }
            },
            'towers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.towers)) {
                        this.saveTowers();
                    }
                    if( _.isUndefined(this._towers) ){ 
                        this._towers = [];
                        var add = id => { addById(this._towers, id); };
                        _.forEach(this.memory.towers, add);
                    }
                    return this._towers;
                }
            },
            'towerFreeCapacity': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._towerFreeCapacity) ) { 
                        this._towerFreeCapacity = 0;
                        var addFreeCapacity = tower => this._towerFreeCapacity += (tower.energyCapacity - tower.energy);
                        _.forEach(this.towers, addFreeCapacity);
                    }
                    return this._towerFreeCapacity;
                }
            },
            'constructionSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._constructionSites) ) { 
                        this._constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES); 
                        let siteOrder = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_STORAGE,STRUCTURE_TOWER,STRUCTURE_ROAD,STRUCTURE_CONTAINER,STRUCTURE_EXTRACTOR,STRUCTURE_WALL,STRUCTURE_RAMPART];
                        let getOrder = site => {let o = siteOrder.indexOf(site); return o < 0 ? 100 : o;};
                        this._constructionSites.sort( (a, b) => {return getOrder(a.structureType) - getOrder(b.structureType);} );
                    }
                    return this._constructionSites;
                }
            },
            'repairableSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._repairableSites) ){ 
                        let that = this;
                        this._repairableSites = _.sortBy(that.find(FIND_STRUCTURES, {
                            filter: (structure) => (
                                structure.hits < structure.hitsMax && 
                                (!that.controller || !that.controller.my || structure.hits < MAX_REPAIR_LIMIT[that.controller.level] ) && 
                                ( !DECAYABLES.includes(structure.structureType) || (structure.hitsMax - structure.hits) > GAP_REPAIR_DECAYABLE ) && 
                                (structure.towers === undefined || structure.towers.length == 0)) }) , 
                            'hits'
                        );
                    }
                    return this._repairableSites;
                }
            },
            'urgentRepairableSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._urgentRepairableSites) ){ 
                        var isUrgent = site => (site.hits < LIMIT_URGENT_REPAIRING || 
                            (site.structureType === 'container' && site.hits < LIMIT_URGENT_REPAIRING * 15)); 
                        this._urgentRepairableSites = _.filter(this.repairableSites, isUrgent);
                    }
                    return this._urgentRepairableSites;
                }
            }, 
            'fuelables': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fuelables) ){
                        var that = this; 
                        var factor = that.situation.invasion ? 1 : 0.82;
                        var fuelable = target => (target.energy < (target.energyCapacity * factor));
                        this._fuelables = _.sortBy( _.filter(this.towers, fuelable), 'energy') ; // TODO: Add Nuker
                    }
                    return this._fuelables;
                }
            },
            'container': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.container)) {
                        this.saveContainers();
                    }
                    if( _.isUndefined(this._container) ){ 
                        this._container = [];
                        let add = entry => {
                            let cont = Game.getObjectById(entry.id); 
                            if( cont ) {
                                _.assign(cont, entry);
                                this._container.push(cont);
                            }
                        };
                        _.forEach(this.memory.container, add);
                    }
                    return this._container;
                }
            },
            'containerController': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerController) ){ 
                        let byType = c => c.controller == true;
                        this._containerController = _.filter(this.container, byType);
                    }
                    return this._containerController;
                }
            },
            'containerIn': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerIn) ){ 
                        let byType = c => (c.source === true || c.mineral === true ) && c.controller == false;
                        this._containerIn = _.filter(this.container, byType);
                        // add managed
                        let isFull = c => _.sum(c.store) >= (c.storeCapacity * (1-MANAGED_CONTAINER_TRIGGER));
                        this._containerIn = this._containerIn.concat(this.containerManaged.filter(isFull));
                    }
                    return this._containerIn;
                }
            },
            'containerOut': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerOut) ){ 
                        let byType = c => (c.source === false && !c.mineral);
                        this._containerOut = _.filter(this.container, byType);
                        // add managed                         
                        let isEmpty = c => _.sum(c.store) <= (c.storeCapacity * MANAGED_CONTAINER_TRIGGER);
                        this._containerOut = this._containerOut.concat(this.containerManaged.filter(isEmpty));
                    }
                    return this._containerOut;
                }
            },
            'containerManaged': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerManaged) ){ 
                        let byType = c => c.source === true && c.controller == true;
                        this._containerManaged = _.filter(this.container, byType);
                    }
                    return this._containerManaged;
                }
            },
            'links': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.links)) {
                        this.saveLinks();
                    }
                    if( _.isUndefined(this._links) ){ 
                        this._links = [];
                        let add = entry => {
                            let o = Game.getObjectById(entry.id); 
                            if( o ) {
                                _.assign(o, entry);
                                this._links.push(o);
                            }
                        };
                        _.forEach(this.memory.links, add);
                    }
                    return this._links;
                }
            },
            'linksController': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._linksController) ){ 
                        let byType = c => c.controller === true;
                        this._linksController = this.links.filter(byType);
                    }
                    return this._linksController;
                }
            },
            'linksStorage': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._linksStorage) ) { 
                        let byType = l => l.storage == true;
                        this._linksStorage = this.links.filter(byType);
                    }
                    return this._linksStorage;
                }
            },
            'linksIn': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._linksIn) ) { 
                        let byType = l => l.storage == false && l.controller == false;
                        this._linksIn = _.filter(this.links, byType);
                    }
                    return this._linksIn;
                }
            },
            'creeps': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._creeps) ){ 
                        this._creeps = this.find(FIND_MY_CREEPS);
                    }
                    return this._creeps;
                }
            },
            'hostiles': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._hostiles) ){ 
                        this._hostiles = this.find(FIND_HOSTILE_CREEPS);
                    }
                    return this._hostiles;
                }
            },
            'hostileIds': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._hostileIds) ){ 
                        this._hostileIds = _.map(this.hostiles, 'id');
                    }
                    return this._hostileIds;
                }
            },
            'combatCreeps': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._combatCreeps) ){ 
                        this._combatCreeps = this.creeps.filter( c => ['melee','ranger','healer'].includes(c.data.creepType) );
                    }
                    return this._combatCreeps;
                }
            },
            'situation': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._situation) ){ 
                        this._situation = {
                            noEnergy: this.sourceEnergyAvailable == 0, 
                            invasion: this.hostiles.length > 0
                        }
                    }
                    return this._situation;
                }
            },
            'casualties': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._casualties) ){ 
                        var isInjured = creep => creep.hits < creep.hitsMax && 
                            (creep.towers === undefined || creep.towers.length == 0);
                        this._casualties = _.sortBy(_.filter(this.creeps, isInjured), 'hits');
                    }
                    return this._casualties;
                }
            },
            'roadConstructionTrace': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this.memory.roadConstructionTrace) ) {
                        this.memory.roadConstructionTrace = {};
                    }
                    return this.memory.roadConstructionTrace;
                }
            }, 
            'adjacentRooms': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this.memory.adjacentRooms) ) {
                        this.memory.adjacentRooms = Room.adjacentRooms(this.name);
                    }
                    return this.memory.adjacentRooms;
                }
            },
            'adjacentAccessibleRooms': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this.memory.adjacentAccessibleRooms) ) {
                        this.memory.adjacentAccessibleRooms = Room.adjacentAccessibleRooms(this.name);
                    }
                    return this.memory.adjacentAccessibleRooms;
                }
            },
            'privateerMaxWeight': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this._privateerMaxWeight) ) {
                        this._privateerMaxWeight = 0;
                        let base = 5000;
                        let that = this;
                        let adjacent, ownNeighbor, room;

                        let flagEntries = FlagDir.filter(FLAG_COLOR.invade.exploit);
                        let countOwn = roomName => {
                            if( roomName == that.name ) return;
                            room = Game.rooms[roomName];
                            if( room && room.controller && room.controller.my )
                                ownNeighbor++;
                        };
                        let calcWeight = flagEntry => {
                            if( !this.adjacentAccessibleRooms.includes(flagEntry.roomName) ) return;
                            room = Game.rooms[flagEntry.roomName];
                            if( room )
                                adjacent = room.adjacentAccessibleRooms;
                            else adjacent = Room.adjacentAccessibleRooms(flagEntry.roomName);
                            ownNeighbor = 1;
                            adjacent.forEach(countOwn);
                            that._privateerMaxWeight += (base / ownNeighbor);
                        };
                        flagEntries.forEach(calcWeight);
                    };
                    return this._privateerMaxWeight;
                }
            },
            'claimerMaxWeight': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this._claimerMaxWeight) ) {
                        this._claimerMaxWeight = 0;
                        let base = 1300;
                        let maxRange = 2;
                        let that = this;
                        let distance, reserved, flag;

                        let flagEntries = FlagDir.filter([FLAG_COLOR.claim, FLAG_COLOR.claim.reserve]);
                        let calcWeight = flagEntry => {
                            distance = Room.roomDistance(that.name, flagEntry.roomName);
                            if( distance > maxRange ) 
                                return;
                            flag = Game.flags[flagEntry.name];
                            if( flag.room && flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd > 2500)
                                return;

                            reserved = flag.targetOf ? _.sum( flag.targetOf.map( t => t.weight )) : 0;
                            that._claimerMaxWeight += (base - reserved);
                        };
                        flagEntries.forEach(calcWeight);
                    };
                    return this._claimerMaxWeight;
                }
            },
            'minStorageLevel': {
                configurable: true,
                get: function () {
                    let defConMin = SPAWN_DEFENSE_ON_ATTACK ? 
                        (Creep.setup.melee.maxCost(this) + Creep.setup.ranger.maxCost(this)) * 1.5 : // one of each + buffer
                        0; 
                    return Math.max(MIN_STORAGE_ENERGY, defConMin);
                }
            },
            'conserveForDefense': {
                configurable: true,
                get: function () {
                    if (!this.storage) return false; // No storage 
                    return (this.storage.store.energy < this.minStorageLevel); 
                }
            },
            'hostileThreatLevel': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this._hostileThreatLevel) ) {
                        // TODO: add towers when in foreign room
                        this._hostileThreatLevel = 0;
                        let evaluateBody = creep => {
                            this._hostileThreatLevel += Creep.bodyThreat(creep.body);
                        };
                        this.hostiles.forEach(evaluateBody);
                    }
                    return this._hostileThreatLevel;
                }
            },
            'defenseLevel': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this._defenseLevel) ) {
                        this._defenseLevel = {
                            melee: 0, 
                            ranger: 0,
                            healer: 0,
                            towers: 0,
                            threat: 0, 
                            sum: 0
                        }
                        let evaluate = creep => {
                            this._defenseLevel.threat += Creep.bodyThreat(creep.body);
                            this._defenseLevel[creep.data.creepType] += creep.data.weight;
                        };
                        this.combatCreeps.forEach(evaluate);
                        this._defenseLevel.towers = this.towers.length;
                        this._defenseLevel.sum = this._defenseLevel.threat + (this._defenseLevel.towers * 18);
                    }
                    return this._defenseLevel;
                }
            },
            'minerals': {
                configurable:true,
                get: function () {
                    if( _.isUndefined(this.memory.minerals)) {
                        this.saveMinerals();
                    }
                    if( _.isUndefined(this._minerals) ){
                        this._minerals = [];
                        let add = id => { addById(this._minerals, id); };
                        this.memory.minerals.forEach(add);
                    }
                    return this._minerals;
                }
            }
        });

        Room.isMine = function(roomName) {
            let room = Game.rooms[roomName];
            return( room && room.controller && room.controller.my );
        };

        Room.prototype.defenseMaxWeight = function(base, type) {
            let defenseMaxWeight = 0;
            //let base = 2000;
            let maxRange = 2;
            let that = this;
            let distance, reserved, flag;

            let flagEntries = FlagDir.filter(FLAG_COLOR.defense);
            let calcWeight = flagEntry => {
                distance = Room.roomDistance(that.name, flagEntry.roomName);
                if( distance > maxRange ) 
                    return;
                flag = Game.flags[flagEntry.name];

                let ownNeighbor = 0;
                let validRooms = [];
                let exits = Game.map.describeExits(flag.pos.roomName);
                let addValidRooms = (roomName) => {
                    if( !validRooms.includes(roomName) ){
                        validRooms.push(roomName);
                        if( Room.isMine(roomName) ) ownNeighbor++;
                    }
                    let roomExits = Game.map.describeExits(roomName);
                    let add = roomName2 => {
                        if( !validRooms.includes(roomName2) ){
                            validRooms.push(roomName2);
                                if( Room.isMine(roomName2) ) ownNeighbor++;
                        }                                         
                    }
                    _.forEach(roomExits, add);
                }
                _.forEach(exits, addValidRooms);
                if( flag.targetOf ){
                    let ofType = flag.targetOf.filter(t => t.creepType == type);
                    reserved = _.sum(ofType,'weight');
                } else reserved = 0;
                defenseMaxWeight += ( (base - reserved) / ownNeighbor );
            };
            flagEntries.forEach(calcWeight);
            return defenseMaxWeight;
        }

        Room.adjacentAccessibleRooms = function(roomName, diagonal = true) {
            let validRooms = [];
            let exits = Game.map.describeExits(roomName);
            let addValidRooms = (roomName, direction) => {
                if( diagonal ) {
                    let roomExits = Game.map.describeExits(roomName);
                    let dirA = (direction + 2) % 8;
                    let dirB = (direction + 6) % 8; 
                    if( roomExits[dirA] && !validRooms.includes(roomExits[dirA]) )
                        validRooms.push(roomExits[dirA]);
                    if( roomExits[dirB] && !validRooms.includes(roomExits[dirB]) )
                        validRooms.push(roomExits[dirB]);
                }
                validRooms.push(roomName);
            }
            _.forEach(exits, addValidRooms);
            return validRooms;
        },
        Room.adjacentRooms = function(roomName){
            let parts = roomName.split(/([N,E,S,W])/);
            let dirs = ['N','E','S','W'];
            let toggle = q => dirs[ (dirs.indexOf(q)+2) % 4 ];
            let names = [];
            for( let x = parseInt(parts[2])-1; x < parseInt(parts[2])+2; x++ ){
                for( let y = parseInt(parts[4])-1; y < parseInt(parts[4])+2; y++ ){
                    names.push( ( x < 0 ? toggle(parts[1]) + '0' : parts[1] + x ) + ( y < 0 ? toggle(parts[3]) + '0' : parts[3] + y ) );
                }
            }
            return names;
        };
        Room.roomDistance = function(roomName1, roomName2, diagonal){
            if( roomName1 == roomName2 ) return 0;
            let posA = roomName1.split(/([N,E,S,W])/);
            let posB = roomName2.split(/([N,E,S,W])/);
            let xDif = posA[1] == posB[1] ? Math.abs(posA[2]-posB[2]) : posA[2]+posB[2]+1;
            let yDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
            if( diagonal ) return Math.max(xDif, yDif); // count diagonal as 1 
            return xDif + yDif; // count diagonal as 2        
        };
        /*
        Room.adjacentFields = function(pos, where = null){
            let fields = [];
            for(x = pos.x-1; x < pos.x+2; x++){
                for(y = pos.y-1; y < pos.y+2; y++){
                    if( x > 1 && x < 48 && y > 1 && y < 48 ){
                        let p = new RoomPosition(x, y, pos.roomName);
                        if( !where || where(p) )
                            fields.push(p);
                    }
                }
            }
            return fields;
        };*/

        Room.validFields = function(roomName, minX, maxX, minY, maxY, checkWalkable = false, where = null) {
            let look;
            if( checkWalkable ) {
                look = Game.rooms[roomName].lookAtArea(minY,minX,maxY,maxX);
            }
            let invalidObject = o => {
                return ((o.type == 'terrain' && o.terrain == 'wall') || 
                    (o.type == 'structure' && OBSTACLE_OBJECT_TYPES.includes(o.structure.structureType)));
            };
            let isWalkable = (posX, posY) => look[posY][posX].filter(invalidObject).length == 0;

            let fields = [];
            for( let x = minX; x <= maxX; x++) {
                for( let y = minY; y <= maxY; y++){
                    if( x > 1 && x < 48 && y > 1 && y < 48 ){
                        if( !checkWalkable || isWalkable(x,y) ){
                            let p = new RoomPosition(x, y, roomName);
                            if( !where || where(p) )
                                fields.push(p);
                        }
                    }
                }
            }
            return fields;
        };
        // args = { spots: [{pos: RoomPosition, range:1}], checkWalkable: false, where: ()=>{}, roomName: abc ) }
        Room.fieldsInRange = function(args) {
            let plusRangeX = args.spots.map(spot => spot.pos.x + spot.range);
            let plusRangeY = args.spots.map(spot => spot.pos.y + spot.range);
            let minusRangeX = args.spots.map(spot => spot.pos.x - spot.range);
            let minusRangeY = args.spots.map(spot => spot.pos.y - spot.range);
            let minX = Math.max(...minusRangeX);
            let maxX = Math.min(...plusRangeX);
            let minY = Math.max(...minusRangeY);
            let maxY = Math.min(...plusRangeY);
            return Room.validFields(args.roomName, minX, maxX, minY, maxY, args.checkWalkable, args.where);
        };

        Room.prototype.roadConstruction = function( minDeviation = ROAD_CONSTRUCTION_MIN_DEVIATION ) {

            if( !ROAD_CONSTRUCTION_ENABLE || Game.time % ROAD_CONSTRUCTION_INTERVAL != 0 ) return;

            let data = Object.keys(this.roadConstructionTrace)
                .map( k => { 
                    return { // convert to [{key,n,x,y}]
                        'n': this.roadConstructionTrace[k], // count of steps on x,y cordinates
                        'x': k.charCodeAt(0)-32, // extract x from key
                        'y': k.charCodeAt(1)-32 // extraxt y from key
                    };
                });
                
            let min = Math.max(ROAD_CONSTRUCTION_ABS_MIN, (data.reduce( (_sum, b) => _sum + b.n, 0 ) / data.length) * minDeviation);

            data = data.filter( e => {
                return e.n > min && 
                    this.lookForAt(LOOK_STRUCTURES,e.x,e.y).length == 0 &&
                    this.lookForAt(LOOK_CONSTRUCTION_SITES,e.x,e.y).length == 0;
            });
            
            // build roads on all most frequent used fields
            let setSite = pos => {
                if( DEBUG ) console.log(`Constructing new road in ${this.name} at ${pos.x}'${pos.y} (${pos.n} traces)`);
                this.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            };
            _.forEach(data, setSite);

            // clear old data
            this.roadConstructionTrace = {};
        };
        Room.prototype.recordMove = function(creep){
            if( !ROAD_CONSTRUCTION_ENABLE ) return;
            let x = creep.pos.x;
            let y = creep.pos.y;
            if ( x == 0 || y == 0 || x == 49 || y == 49 || 
                creep.carry.energy == 0 || creep.data.actionName == 'building' ) 
                return;

            let key = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;
            if( !this.roadConstructionTrace[key] )
                this.roadConstructionTrace[key] = 1;
            else this.roadConstructionTrace[key]++;
        };

        Room.prototype.saveTowers = function(){
            let towers = this.find(FIND_MY_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            });
            if( towers.length > 0 ){
                var id = obj => obj.id;
                this.memory.towers = _.map(towers, id);
            } else this.memory.towers = [];
        };
        Room.prototype.saveSpawns = function(){
            let spawns = this.find(FIND_MY_SPAWNS);
            if( spawns.length > 0 ){
                let id = o => o.id;
                this.memory.spawns = _.map(spawns, id);
            } else this.memory.spawns = [];
        };
        Room.prototype.saveContainers = function(){
            this.memory.container = [];
            let containers = this.find(FIND_STRUCTURES, {
                filter: (structure) => ( structure.structureType == STRUCTURE_CONTAINER )
            });
            let add = (cont) => {
                let source = cont.pos.findInRange(this.sources, 1);
                let mineral = cont.pos.findInRange(this.minerals, 1);
                this.memory.container.push({
                    id: cont.id, 
                    source: (source.length > 0), 
                    controller: ( cont.pos.getRangeTo(this.controller) < 4 ),
                    mineral: (mineral.length > 0),
                });
                let assignContainer = s => s.memory.container = cont.id;
                source.forEach(assignContainer);  
            };
            containers.forEach(add);
        };
        Room.prototype.saveLinks = function(){
            if( _.isUndefined(this.memory.links) ){ 
                this.memory.links = [];
            } 
            let links = this.find(FIND_MY_STRUCTURES, {
                filter: (structure) => ( structure.structureType == STRUCTURE_LINK )
            });
            let storageLinks = this.storage ? this.storage.pos.findInRange(links, 2).map(l => l.id) : [];

            // for each memory entry, keep if existing
            let kept = [];
            let keep = (entry) => {
                if( links.find( (c) => c.id == entry.id )){
                    entry.storage = storageLinks.includes(entry.id);
                    kept.push(entry); 
                }                    
            };
            this.memory.links.forEach(keep);
            //this.memory.links = kept;
            this.memory.links = [];

            // for each link add to memory ( if not contained )
            let add = (link) => {
                if( !this.memory.links.find( (l) => l.id == link.id ) ) {
                    let isControllerLink = ( link.pos.getRangeTo(this.controller) < 4 );
                    this.memory.links.push({
                        id: link.id, 
                        storage: storageLinks.includes(link.id),
                        controller: isControllerLink
                    });
                    if( !isControllerLink ) {
                        let source = link.pos.findInRange(this.sources, 2);
                        let assign = s => s.memory.link = link.id;
                        source.forEach(assign);  
                    }                  
                }
            };
            links.forEach(add);
        };
        Room.prototype.saveMinerals = function() {
            let that = this;
            let toPos = o => { return {
                x: o.pos.x,
                y: o.pos.y
            };};
            let extractorPos = this.find(FIND_STRUCTURES, {filter:{structureType:STRUCTURE_EXTRACTOR}}).map(toPos);
            let hasExtractor = m => _.some(extractorPos, {
                x: m.pos.x, 
                y: m.pos.y
            });
            this._minerals = this.find(FIND_MINERALS).filter(hasExtractor);
            if( this._minerals.length > 0 ){
                let id = o => o.id;
                this.memory.minerals = _.map(that._minerals, id);
            } else this.memory.minerals = [];
        };
        
        Room.prototype.linksManager = function () {
            let filled = l => l.cooldown == 0 && l.energy > l.energyCapacity * 0.85;
            let empty = l =>  l.energy < l.energyCapacity * 0.15;
            let filledIn = this.linksIn.filter(filled); 
            let emptyController = this.linksController.filter(empty); 

            if( filledIn.length > 0  ){
                let emptyStorage = this.linksStorage.filter(empty); 
                
                let handleFilledIn = f => { // first fill controller, then storage
                    if( emptyController.length > 0 ){
                        f.transferEnergy(emptyController[0]);
                        emptyController.shift();
                    } else if( emptyStorage.length > 0 ){
                        f.transferEnergy(emptyStorage[0]);
                        emptyStorage.shift();
                    }
                }
                filledIn.forEach(handleFilledIn);
            }

            if( emptyController.length > 0 ){ // controller still empty, send from storage
                let filledStorage = this.linksStorage.filter(filled); 
                let handleFilledStorage = f => {
                    if( emptyController.length > 0 ){
                        f.transferEnergy(emptyController[0]);
                        emptyController.shift();
                    }
                }
                filledStorage.forEach(handleFilledStorage);
            }
        };
        Room.prototype.springGun = function(){
            if( this.situation.invasion ){
                let idleSpawns = this.spawns.filter( s => !s.spawning );
                for( let iSpawn = 0; iSpawn < idleSpawns.length && this.defenseLevel.sum < this.hostileThreatLevel; iSpawn++ ) {
                    // need more Defense!
                    let setup;
                    if( this.defenseLevel.melee > this.defenseLevel.ranger ) { 
                        setup = Creep.setup.ranger; 
                    } else {
                        setup = Creep.setup.melee; 
                    }
                    if( DEBUG ) console.log( dye(CRAYON.system, this.name + ' &gt; ') + 'Spring Gun System activated in room ' + this.name + '! Trying to spawn an additional ' + setup.type + '.');
                    let creepParams = idleSpawns[iSpawn].createCreepBySetup(setup);
                    if( creepParams ){
                        // add to defenseLevel
                        this._defenseLevel.threat += Creep.bodyThreat(creepParams.parts);
                        this._defenseLevel[creepParams.setup] += creepParams.cost;
                    }
                }
            }
        };
        
        Room.prototype.loop = function(){
            delete this._sourceEnergyAvailable;
            delete this._ticksToNextRegeneration;
            delete this._relativeEnergyAvailable;
            delete this._towerFreeCapacity;
            delete this._constructionSites;
            delete this._repairableSites;
            delete this._fuelables;
            delete this._urgentRepairableSites;
            delete this._hostiles;
            delete this._hostileIds;
            delete this._situation;
            delete this._maxPerJob;
            delete this._creeps
            delete this._casualties;
            delete this._container;
            delete this._containerIn;
            delete this._containerOut;
            //delete this._containerSource;
            delete this._containerManaged;
            delete this._containerController;
            delete this._links;
            delete this._linksController;
            delete this._linksStorage;
            delete this._linksIn;
            delete this._privateerMaxWeight;
            delete this._claimerMaxWeight;
            delete this._combatCreeps;
            delete this._defenseLevel;
            delete this._hostileThreatLevel;
            delete this._minerals;
              
            try {                
                let that = this; 
                if( Game.time % MEMORY_RESYNC_INTERVAL == 0 ) {
                    //if( DEBUG ) console.log('MEMORY_RESYNC_INTERVAL reached');
                    this.saveMinerals();
                    this.saveTowers();
                    this.saveSpawns();
                    this.saveContainers();
                    this.saveLinks();
                }
                if( this.memory.hostileIds === undefined )
                    this.memory.hostileIds = [];
                if( this.memory.statistics === undefined)
                    this.memory.statistics = {};

                this.roadConstruction();
                this.springGun();
                this.linksManager();

                if( this.controller && this.controller.my ) {
                    var registerHostile = creep => {
                        if( !that.memory.hostileIds.includes(creep.id) ){ 
                            var bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                            if( NOTIFICATE_INVADER || creep.owner.username != 'Invader' ){
                                var message = 'Hostile intruder ' + creep.id + ' (' + bodyCount + ') from "' + creep.owner.username + '" in room ' + that.name + ' at ' + toDateTimeString(toLocalDate(new Date()));
                                Game.notify(message);
                                console.log(message);
                            }
                            if(that.memory.statistics.invaders === undefined)
                                that.memory.statistics.invaders = [];
                            that.memory.statistics.invaders.push({
                                owner: creep.owner.username, 
                                id: creep.id,
                                body: bodyCount, 
                                enter: Game.time, 
                                time: Date.now()
                            });
                        }
                    }
                    _.forEach(this.hostiles, registerHostile);
                    
                    var registerHostileLeave = id => {
                        if( !that.hostileIds.includes(id) && that.memory.statistics && that.memory.statistics.invaders !== undefined && that.memory.statistics.invaders.length > 0){
                            var select = invader => invader.id == id && invader.leave === undefined;
                            var entry = _.find(that.memory.statistics.invaders, select);
                            if( entry != undefined ) entry.leave = Game.time;
                        }
                    }
                    _.forEach(this.memory.hostileIds, registerHostileLeave);
                }
            }
            catch(err) {
                Game.notify('Error in room.js (Room.prototype.loop): ' + err);
                console.log('Error in room.js (Room.prototype.loop): ' + err);
            }
            this.memory.hostileIds = this.hostileIds;            
        };
    }
}

module.exports = mod;
