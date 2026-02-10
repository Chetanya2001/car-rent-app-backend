module.exports = (sequelize, DataTypes) => {
  const TradeOffer = sequelize.define("TradeOffer", {
    offer_price: DataTypes.DECIMAL(10, 2),
    message: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
    },
  });

  TradeOffer.associate = (models) => {
    TradeOffer.belongsTo(models.TradeRequest, {
      foreignKey: "request_id",
    });

    TradeOffer.belongsTo(models.TradeListing, {
      foreignKey: "listing_id",
    });
  };

  return TradeOffer;
};
