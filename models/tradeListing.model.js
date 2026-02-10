module.exports = (sequelize, DataTypes) => {
  const TradeListing = sequelize.define("TradeListing", {
    asking_price: DataTypes.DECIMAL(10, 2),
    city: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM("active", "sold", "inactive"),
      defaultValue: "active",
    },
  });

  TradeListing.associate = (models) => {
    TradeListing.belongsTo(models.User, {
      foreignKey: "seller_id",
      as: "seller",
    });

    TradeListing.belongsTo(models.Car, {
      foreignKey: "car_id",
      as: "car",
    });

    TradeListing.hasMany(models.TradeOffer, {
      foreignKey: "listing_id",
      as: "offers",
    });
  };

  return TradeListing;
};
