const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BankUserSchema = mongoose.Schema({
    fullName: { type: String, trim: true, required: true },
    email: { type: String, lowercase: true, trim: true, required: true, unique: true },
    accountNumber: { type: String, unique: true, sparse: true },
    balance: { type: Number, default: 100000 },
    password: { type: String, required: true, select: false },
    transactionPin: { type: String, select: false }, // 4-digit PIN for transactions
    roles: { type: String, enum: ["admin", "user"], default: "user" },
}, { timestamps: true });

// ─── AUTO-GENERATE ACCOUNT NUMBER ───────────────────────────
BankUserSchema.pre('save', async function () {
    // Generate account number only if it doesn't exist yet
    if (!this.accountNumber) {
        let isUnique = false;
        let accountNumber;

        // Keep generating until we get a unique one (collision is extremely rare but safe)
        while (!isUnique) {
            const prefix = "22";
            const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
            accountNumber = prefix + randomDigits;

            const existing = await mongoose.model('bankUser').findOne({ accountNumber });
            if (!existing) isUnique = true;
        }

        this.accountNumber = accountNumber;
    }

    // ─── HASH PASSWORD ───────────────────────────────────────
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ─── COMPARE PASSWORD METHOD ────────────────────────────────
BankUserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ─── COMPARE TRANSACTION PIN METHOD ─────────────────────────
BankUserSchema.methods.compareTransactionPin = async function (enteredPin) {
    if (!this.transactionPin) return false;
    return await bcrypt.compare(enteredPin, this.transactionPin);
};

// ─── SET TRANSACTION PIN METHOD ─────────────────────────────
BankUserSchema.methods.setTransactionPin = async function (pin) {
    const salt = await bcrypt.genSalt(10);
    this.transactionPin = await bcrypt.hash(pin, salt);
};

// ─── RETURN SAFE USER OBJECT (excludes password) ─────────────
BankUserSchema.methods.toSafeObject = function () {
    const user = this.toObject();
    delete user.password;
    delete user.transactionPin;
    return user;
};

const BankUserModel = mongoose.model('bankUser', BankUserSchema);

module.exports = BankUserModel;
