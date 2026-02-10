module.exports = (sequelize, DataTypes) => {
  const TradeRequest = sequelize.define("TradeRequest", {
    preferred_make: DataTypes.STRING,
    preferred_model: DataTypes.STRING,
    min_year: DataTypes.INTEGER,
    max_year: DataTypes.INTEGER,
    budget: DataTypes.DECIMAL(10, 2),
    city: DataTypes.STRING,
    notes: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM("open", "matched", "closed", "cancelled"),
      defaultValue: "open",
    },
  });

  TradeRequest.associate = (models) => {
    TradeRequest.belongsTo(models.User, {
      foreignKey: "buyer_id",
      as: "buyer",
    });

    TradeRequest.hasMany(models.TradeOffer, {
      foreignKey: "request_id",
      as: "offers",
    });
  };

  return TradeRequest;
};
