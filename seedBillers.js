const mongoose = require("mongoose");

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sfa-bank";

const billerSchema = new mongoose.Schema({
  billerName: { type: String, required: true, trim: true },
  billerCode: { type: String, required: true, unique: true, trim: true },
  category: {
    type: String,
    enum: ["electricity", "internet", "cable", "water", "phone", "betting", "other"],
    default: "other",
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Biller = mongoose.model("Biller", billerSchema);

const billersData = [
  // Electricity
  { billerName: "EKEDC (Eko Electric)", billerCode: "EKEDC", category: "electricity" },
  { billerName: "IKEDC (Ikeja Electric)", billerCode: "IKEDC", category: "electricity" },
  { billerName: "AEDC (Abuja Electric)", billerCode: "AEDC", category: "electricity" },
  { billerName: "PHEDC (Port Harcourt)", billerCode: "PHEDC", category: "electricity" },
  
  // Internet
  { billerName: "MTN Internet", billerCode: "MTN_INT", category: "internet" },
  { billerName: "Glo Internet", billerCode: "GLO_INT", category: "internet" },
  { billerName: "Spectranet", billerCode: "SPECTRA", category: "internet" },
  { billerName: "Smile 4G", billerCode: "SMILE", category: "internet" },
  
  // Cable TV
  { billerName: "DSTV", billerCode: "DSTV", category: "cable" },
  { billerName: "GOtv", billerCode: "GOTV", category: "cable" },
  { billerName: "StarTimes", billerCode: "STIMES", category: "cable" },
  
  // Phone/Airtime
  { billerName: "MTN", billerCode: "MTN", category: "phone" },
  { billerName: "Glo", billerCode: "GLO", category: "phone" },
  { billerName: "Airtel", billerCode: "AIRTEL", category: "phone" },
  { billerName: "9mobile", billerCode: "9MOB", category: "phone" },
  
  // Water
  { billerName: "Lagos Water Corp", billerCode: "LWSC", category: "water" },
  { billerName: "FCT Water Board", billerCode: "FWSC", category: "water" },
  
  // Betting
  { billerName: "SPORTYBET", billerCode: "SPORTY", category: "betting" },
  { billerName: "BETKING (NG)", billerCode: "BETKINGNG", category: "betting" },
  { billerName: "BET9JA (9JA)", billerCode: "BET9JA", category: "betting" },
  { billerName: "1X BET", billerCode: "1XBT", category: "betting" },
  
  // Other
  { billerName: "Remita", billerCode: "REMITA", category: "other" },
  { billerName: "LAWMA (Waste)", billerCode: "LAWMA", category: "other" },
];

async function seedBillers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing billers
    await Biller.deleteMany({});
    console.log("🗑️  Cleared existing billers");

    // Insert new billers
    const result = await Biller.insertMany(billersData);
    console.log(`✅ Seeded ${result.length} billers`);

    // Display the billers
    console.log("\n📋 Billers in database:");
    result.forEach(b => console.log(`  - ${b.billerName} (${b.billerCode}) [${b.category}]"));

    console.log("\n✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding billers:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedBillers();

