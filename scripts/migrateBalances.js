#!/usr/bin/env node

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BankUser = require('../models/bankUser.model');
const Account = require('../models/account.model');

dotenv.config();

async function migrateBalances() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all BankUsers with accounts
    const bankUsers = await BankUser.find({}).select('_id balance accountNumber');
    console.log(`📊 Found ${bankUsers.length} BankUsers`);

    let updated = 0;
    let skipped = 0;

    for (const bu of bankUsers) {
      // Find matching Account
      const account = await Account.findOne({ 
        userId: bu._id,
        accountNumber: bu.accountNumber 
      });

      if (!account) {
        console.log(`⚠️  No Account for BankUser ${bu.accountNumber}`);
        continue;
      }

      // Check if balances match (within ₦5 tolerance)
      const diff = Math.abs(account.balance - bu.balance);
      if (diff > 5) {
        console.log(`🔄 Migrating ${bu.accountNumber}: BankUser=₦${bu.balance} → Account=₦${account.balance}`);
        
        account.balance = bu.balance;  // Use BankUser as source of truth
        await account.save();
        updated++;
      } else {
        console.log(`✅ Synced ${bu.accountNumber}: ₦${bu.balance}`);
        skipped++;
      }
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`✅ Updated: ${updated} accounts`);
    console.log(`⏭️  Skipped: ${skipped} (already in sync)`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DB disconnected');
  }
}

migrateBalances();

