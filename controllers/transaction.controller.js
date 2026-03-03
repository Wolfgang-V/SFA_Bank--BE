
const express = require('express');
const BankUserModel = require('../models/bankUser.model');
const bcrypt = require('bcryptjs')
const transactionModel = require('../models/transaction.model');
const jwt = require('jsonwebtoken')
const { generateReference } = require('../models/utils/helper');


const deposit = async (req, res) => {
    try {
        const { accountNumber, amount } = req.body;
        const NumericalAmount = parseFloat(req.body.amount);

        if (isNaN(NumericalAmount) || NumericalAmount <= 0) {
            return res.status(400).send({ message: "Invalid deposit amount" })
        }
        if (NumericalAmount < 100) {
            return res.status(400).send({ message: "Minimum deposit amount is 100" })
        }

        const depositUser = await BankUserModel.findOne({ accountNumber });
        if (!depositUser) {
            return res.status(404).send({ message: "No user found" })
        }

        depositUser.balance += NumericalAmount;
        await depositUser.save();

        const reference = generateReference();

        await transactionModel.create({
            user: depositUser._id,
            reference: reference,
            type: "deposit",
            amount: NumericalAmount,
            senderAccount: depositUser.accountNumber,
            receiverAccount: depositUser.accountNumber,
            description: `Deposit of ${NumericalAmount} to account ${depositUser.accountNumber}`,
            note: req.body.note || ""
        })

        return res.status(200).send({
            message: "Deposit successful",
            data: depositUser,
            reference: reference
        })
    }
    catch (err) {
        console.log("Error making deposit", err);
        return res.status(500).send({
            message: "Deposit failed",
            error: err.message
        })
    }
}


const withdrawal = async (req, res) => {
    try {
        const { accountNumber, amount } = req.body;
        const NumericalAmount = parseFloat(amount);

        if (isNaN(NumericalAmount) || NumericalAmount <= 0) {
            return res.status(422).send({ message: "Invalid withdrawal amount" });
        }
        if (NumericalAmount < 1000) {
            return res.status(422).send({ message: "Minimum withdrawal amount is 1000" });
        }

        const withdrawalUser = await BankUserModel.findOne({ accountNumber });
        if (!withdrawalUser) {
            return res.status(404).send({ message: "No user found" })
        }
        if (withdrawalUser.balance < NumericalAmount) {
            return res.status(409).send({ message: "Insufficient balance" })
        }

        withdrawalUser.balance -= NumericalAmount;
        await withdrawalUser.save();

        const reference = generateReference();

        await transactionModel.create({
            user: withdrawalUser._id,
            reference: reference,
            type: "withdrawal",
            amount: NumericalAmount,
            senderAccount: withdrawalUser.accountNumber,
            receiverAccount: withdrawalUser.accountNumber,
            description: `Withdrawal of ${NumericalAmount} from account ${withdrawalUser.accountNumber}`,
            note: req.body.note || ""
        })

        return res.status(200).send({
            message: "Withdrawal successful",
            data: withdrawalUser,
            reference: reference,
            Transaction: {
                reference: reference,
                type: "withdrawal",
                amount: NumericalAmount,
                senderAccount: withdrawalUser.accountNumber,
                receiverAccount: withdrawalUser.accountNumber,
                description: `Withdrawal of ${NumericalAmount} from account ${withdrawalUser.accountNumber}`,
                note: req.body.note || ""
            }
        })
    }
    catch (error) {
        console.log("Error making withdrawal", error);
        return res.status(500).send({
            message: "Withdrawal failed",
            error: error.message
        })
    }
}


const Transfer = async (req, res) => {
    try {
        // ✅ Sender is taken from the logged-in user's token — not from req.body
        const senderAccount = req.user.accountNumber;
        const receiverAccount = req.body.receiverAccount?.trim();
        const NumericalAmount = parseFloat(req.body.amount);

        // ✅ Check receiver account is provided
        if (!receiverAccount) {
            return res.status(422).send({
                message: "Receiver account number is required"
            });
        }

        // ✅ Check sender is not sending to themselves
        if (senderAccount === receiverAccount) {
            return res.status(422).send({
                message: "You cannot transfer money to your own account"
            });
        }

        if (isNaN(NumericalAmount) || NumericalAmount <= 0) {
            return res.status(422).send({ message: "Invalid transfer amount" });
        }
        if (NumericalAmount < 1000) {
            return res.status(422).send({ message: "Minimum transfer amount is 1000" });
        }

        const senderUser = await BankUserModel.findOne({ accountNumber: senderAccount });
        const receiverUser = await BankUserModel.findOne({ accountNumber: receiverAccount });

        if (!senderUser) {
            return res.status(404).send({ message: "Sender account not found" })
        }
        if (!receiverUser) {
            return res.status(404).send({ message: "Receiver account not found" })
        }
        if (senderUser.balance < NumericalAmount) {
            return res.status(409).send({ message: "Insufficient balance in sender's account" })
        }

        senderUser.balance -= NumericalAmount;
        receiverUser.balance += NumericalAmount;

        await senderUser.save();
        await receiverUser.save();

        const reference = generateReference();

        await transactionModel.create({
            user: senderUser._id,
            reference: reference,
            type: "transfer",
            amount: NumericalAmount,
            senderAccount: senderUser.accountNumber,
            receiverAccount: receiverUser.accountNumber,
            description: `Transfer of ${NumericalAmount} from ${senderUser.fullName},(${senderUser.accountNumber}) to ${receiverUser.fullName},(${receiverUser.accountNumber})`,
            note: req.body.note || ""
        })

        return res.status(200).send({
            message: "Transfer successful",
            data: {
                reference: reference,
                sender: senderUser,
                receiver: receiverUser,
                amount: NumericalAmount,
                description: `Transfer of ${NumericalAmount} from ${senderUser.fullName},(${senderUser.accountNumber}) to ${receiverUser.fullName},(${receiverUser.accountNumber})`,
                note: req.body.note || ""
            }
        })
    }
    catch (error) {
        console.log("Error making transfer", error);
        return res.status(500).send({
            message: "Transfer failed",
            error: error.message
        })
    }
}


const getTransactions = async (req, res) => {
    try {
        const { accountNumber, userId } = req.query;
        const filter = {};
        if (accountNumber) filter.$or = [{ senderAccount: accountNumber }, { receiverAccount: accountNumber }];
        if (userId) filter.user = userId;

        const transactions = await transactionModel.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error('Error fetching transactions', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
};

module.exports = { deposit, withdrawal, Transfer, getTransactions }
