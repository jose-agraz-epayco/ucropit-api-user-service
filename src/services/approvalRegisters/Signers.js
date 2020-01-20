"use strict";

const Common = require("./Common");

class Signers {
  /**
   * Get all signers to event.
   *
   * @param {*} stage
   * @param {*} cropId
   * @param {*} typeId
   * @param {*} type
   */
  static async getSigners(stage, cropId, typeId, type) {
    const permissions = await Common.getProductionPermisionsByCropId(cropId);

    let canSignUsers = permissions
      .map(el => {
        return {
          id: el.user_id,
          events: el.permissions.events.find(el => stage === el.label),
          stages: el.permissions.stages.find(el => stage === el.key)
        };
      })
      .filter(el => el.events !== undefined);

    if (stage !== "fields") {
      canSignUsers = canSignUsers
        .filter(el => el.events.events !== false)
        .filter(el => {
          if (Array.isArray(el.events.events)) {
            return el.events.events.find(el => {
              return (
                el.field_id == typeId &&
                el.type === type &&
                el.permissions.can_sign === true
              );
            });
          } else {
            return el;
          }
        });
    } else {
      canSignUsers = canSignUsers.filter(el => {
        return el.stages.permissions.can_sign === true;
      });
    }

    return canSignUsers;
  }
}

module.exports = Signers;
