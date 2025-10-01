const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CarStandards = sequelize.define(
    "CarStandards",
    {
      car_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transmission: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      seats: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      luggage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fuel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      range: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    { timestamps: true }
  );

  CarStandards.associate = (models) => {
    CarStandards.belongsTo(models.Car, { foreignKey: "car_id" });
  };

  return CarStandards;
};
