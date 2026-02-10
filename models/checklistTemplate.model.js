module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplate = sequelize.define("ChecklistTemplate", {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    sequence: DataTypes.INTEGER,
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  ChecklistTemplate.associate = (models) => {
    ChecklistTemplate.belongsTo(models.ServicePlan, {
      foreignKey: "plan_id",
    });
  };

  return ChecklistTemplate;
};
