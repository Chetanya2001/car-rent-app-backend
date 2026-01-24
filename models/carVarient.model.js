// models/CarVariant.js
module.exports = (sequelize, DataTypes) => {
  const CarVariant = sequelize.define("CarVariant", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    fuel_type: {
      type: DataTypes.ENUM("petrol", "diesel", "cng", "electric", "hybrid"),
      allowNull: false,
    },

    transmission: {
      type: DataTypes.ENUM("manual", "automatic"),
      allowNull: false,
    },
  });

  CarVariant.associate = (models) => {
    CarVariant.belongsTo(models.CarModel, { foreignKey: "model_id" });
  };

  return CarVariant;
};
