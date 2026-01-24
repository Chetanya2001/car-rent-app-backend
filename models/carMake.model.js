// models/CarMake.js
module.exports = (sequelize, DataTypes) => {
  const CarMake = sequelize.define("CarMake", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  CarMake.associate = (models) => {
    CarMake.hasMany(models.CarModel, { foreignKey: "make_id" });
  };

  return CarMake;
};
