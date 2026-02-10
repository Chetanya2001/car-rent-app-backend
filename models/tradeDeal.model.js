module.exports = (sequelize, DataTypes) => {
  const TradeDeal = sequelize.define("TradeDeal", {
    final_price: DataTypes.DECIMAL(10, 2),
    status: {
      type: DataTypes.ENUM("processing", "completed", "cancelled"),
      defaultValue: "processing",
    },
  });

  TradeDeal.associate = (models) => {
    TradeDeal.belongsTo(models.User, { foreignKey: "buyer_id" });
    TradeDeal.belongsTo(models.User, { foreignKey: "seller_id" });

    TradeDeal.belongsTo(models.TradeRequest, {
      foreignKey: "request_id",
    });

    TradeDeal.belongsTo(models.TradeListing, {
      foreignKey: "listing_id",
    });
  };

  return TradeDeal;
};
