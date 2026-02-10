module.exports = (sequelize, DataTypes) => {
  const ServicePlan = sequelize.define("ServicePlan", {
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    duration_minutes: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  ServicePlan.associate = (models) => {
    ServicePlan.hasMany(models.ChecklistTemplate, {
      foreignKey: "plan_id",
      as: "templates",
    });
  };

  return ServicePlan;
};
