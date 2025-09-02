const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CarLocation = sequelize.define(
    "CarLocation",
    {
      city: DataTypes.STRING,
      address: DataTypes.TEXT,
      latitude: DataTypes.DECIMAL(10, 6),
      longitude: DataTypes.DECIMAL(10, 6),
    },
    { timestamps: true }
  );

  CarLocation.associate = (models) => {
    CarLocation.belongsTo(models.Car, { foreignKey: "car_id" });
  };

  return CarLocation;
};
