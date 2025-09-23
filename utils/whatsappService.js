// // services/whatsapp.js
// const axios = require("axios");

// const WHATSAPP_API_URL = "https://graph.facebook.com/v22.0";

// const sendWhatsAppVerification = async (to) => {
//   try {
//     const response = await axios.post(
//       `${WHATSAPP_API_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to,
//         type: "template",
//         template: {
//           name: "hello_world", // ✅ working template name
//           language: { code: "en_US" },
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ WhatsApp message sent:", response.data);
//   } catch (error) {
//     console.error("❌ WhatsApp error:", error.response?.data || error.message);
//   }
// };

// module.exports = { sendWhatsAppVerification };
