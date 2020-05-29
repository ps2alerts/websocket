/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"battle_rank":"",
"character_id":"",
"event_name":"BattleRankUp",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const BattleRankUp = sequelize.define("BattleRankUp", {
      character_id: {
        type: Sequelize.STRING
      },
      event_name: {
        type: Sequelize.STRING
      },
      battle_rank: {
        type: Sequelize.STRING
      },
      world_id: {
        type: Sequelize.STRING
      },
      zone_id: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.STRING
      },
    });
  
    return BattleRankUp;
  };