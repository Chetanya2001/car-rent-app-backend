const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CarFeatures = sequelize.define(
    "CarFeatures",
    {
      car_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      airconditions: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      child_seat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      gps: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      luggage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      music: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      seat_belt: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sleeping_bed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      water: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      bluetooth: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      onboard_computer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      audio_input: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      long_term_trips: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      car_kit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      remote_central_locking: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      climate_control: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { timestamps: true }
  );

  CarFeatures.associate = (models) => {
    CarFeatures.belongsTo(models.Car, { foreignKey: "car_id" });
  };

  return CarFeatures;
};
