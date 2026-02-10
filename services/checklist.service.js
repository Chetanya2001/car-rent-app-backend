const { ChecklistTemplate, ChecklistItem } = require("../models");

exports.cloneChecklist = async (bookingId, planId) => {
  const templates = await ChecklistTemplate.findAll({
    where: { plan_id: planId },
    order: [["sequence", "ASC"]],
  });

  const items = templates.map((t) => ({
    booking_id: bookingId,
    title: t.title,
  }));

  await ChecklistItem.bulkCreate(items);
};
