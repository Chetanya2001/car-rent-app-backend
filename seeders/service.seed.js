const { ServicePlan, ChecklistTemplate } = require("../models");

async function seedService() {
  console.log("🌱 Seeding service plans...");

  const plans = [
    {
      code: "zip_express",
      name: "Zip Express",
      price: 1499,
      duration_minutes: 45,
      description: "Quick service package",
      checklist: [
        "Engine oil top-up",
        "Filter clean",
        "20-point inspection",
        "Dry clean (Air)",
      ],
    },
    {
      code: "zip_classic",
      name: "Zip Classic",
      price: 2999,
      duration_minutes: 120,
      description: "Full classic service",
      checklist: [
        "Oil replacement",
        "Filter change",
        "50-point inspection",
        "Foam wash",
      ],
    },
    {
      code: "zip_repair",
      name: "Zip Repair",
      price: 0,
      duration_minutes: 0,
      description: "Accidental & repair service",
      checklist: [
        "Damage inspection",
        "Repair estimation",
        "Parts replacement",
      ],
    },
    {
      code: "zip_equip",
      name: "Zip Equip",
      price: 0,
      duration_minutes: 0,
      description: "Accessories & upgrades",
      checklist: [
        "Accessories install",
        "Tyre check",
        "Battery check",
        "Genuine parts verification",
      ],
    },
  ];

  for (const planData of plans) {
    let plan = await ServicePlan.findOne({
      where: { code: planData.code },
    });

    if (!plan) {
      plan = await ServicePlan.create({
        code: planData.code,
        name: planData.name,
        price: planData.price,
        duration_minutes: planData.duration_minutes,
        description: planData.description,
      });

      console.log(`✅ Created plan: ${plan.name}`);
    }

    // Seed checklist templates
    for (let i = 0; i < planData.checklist.length; i++) {
      const title = planData.checklist[i];

      const exists = await ChecklistTemplate.findOne({
        where: { plan_id: plan.id, title },
      });

      if (!exists) {
        await ChecklistTemplate.create({
          plan_id: plan.id,
          title,
          sequence: i + 1,
        });
      }
    }
  }

  console.log("✅ Service seeding completed");
}

module.exports = seedService;
