const mongoose = require('mongoose');


const TransactionSchema = mongoose.Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'bankUser', required: true },
    reference: { type: String, required: true, unique: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'transfer', 'bill_payment', 'airtime', 'data', 'wallet_funding', 'refund'], required: true },
    amount: { type: Number, required: true },
    senderAccount: { type: String, required: true },
    receiverAccount: { type: String, required: true}, 
    status: {type: String, enum: ["success", "failed"], default: "success"}  ,
    description: { type: String, required: true },
    note: {type: String } 


}, { timestamps: true });


const TransactionModel = mongoose.model('Transaction', TransactionSchema);  

module.exports = TransactionModel;