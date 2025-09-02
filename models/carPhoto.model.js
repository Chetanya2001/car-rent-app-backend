const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CarPhoto = sequelize.define(
    "CarPhoto",
    {
      photo_url: DataTypes.STRING,
    },
    { timestamps: true }
  );

  CarPhoto.associate = (models) => {
    CarPhoto.belongsTo(models.Car, { foreignKey: "car_id" });
  };

  return CarPhoto;
};
