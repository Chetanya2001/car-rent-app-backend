async function checkEligibilityInternal(userId) {
  const docs = await UserDocuments.findAll({
    where: {
      user_id: userId,
      doc_type: ["Aadhaar", "Driver's License"],
      verification_status: "Verified",
    },
  });

  return {
    eligible: docs.length === 2,
  };
}

module.exports = {
  checkEligibilityInternal,
};
