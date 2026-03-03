const express = require('express');
const BankUserModel = require('../models/bankUser.model');
const OTPModel = require('../models/otp.model');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const { mailSender } = require('../middleware/mailer');

const generateAccountNumber = () => {
    return crypto.randomInt(1000000000, 9999999999).toString();
};

const createBankUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const accountNumber = generateAccountNumber();

        const newBankUser = await BankUserModel.create({
            fullName,
            email,
            accountNumber,
            password
        });

        res.status(201).send({
            message: "Bank user created successfully",
            data: newBankUser.toSafeObject()
        });

    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(400).send({
                message: "Duplicate email or account number"
            });
        }

        res.status(500).send({
            message: "Internal server error"
        });
    }
};

const login = async (req, res) =>{
    const {email, password} = req.body

    try{
        const isUser = await BankUserModel.findOne({email}).select("+password")

        if(!isUser){
            return res.status(404).send({
                message: "Invalid User credential"
            })
        }

        const isMatch = await bcrypt.compare(password, isUser.password)
        if(!isMatch){
            return res.status(404).send({
                message: "Invalid User credential"
            })
        }

        const token = await jwt.sign({id: isUser._id}, process.env.JWT_SECRET, {expiresIn: "5h"})

        res.status(200).send({
            message: "Logged in successfully",
            data: {
                email: isUser.email,
                roles: isUser.roles,
                fullName: isUser.fullName,
                accountNumber: isUser.accountNumber,
                balance: isUser.balance
            },
            token
        })
    }
    catch (error){
        console.log(error);
        res.status(400).send({
            message: "Failed to log in",
            error: error.message
        })
    }
}

const setPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(400).send({
                message: "PIN is required"
            });
        }

        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return res.status(400).send({
                message: "PIN must be exactly 4 digits"
            });
        }

        const userId = req.user._id;
        const user = await BankUserModel.findById(userId);
        
        if (!user) {
            return res.status(404).send({
                message: "User not found"
            });
        }

        await user.setTransactionPin(pin);
        await user.save();

        return res.status(200).send({
            message: "Transaction PIN set successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Failed to set PIN",
            error: error.message
        });
    }
};

const verifyPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(400).send({
                message: "PIN is required"
            });
        }

        const userId = req.user._id;
        const user = await BankUserModel.findById(userId).select("+transactionPin");
        
        if (!user) {
            return res.status(404).send({
                message: "User not found"
            });
        }

        if (!user.transactionPin) {
            return res.status(400).send({
                message: "PIN not set"
            });
        }

        const isValid = await user.compareTransactionPin(pin);
        
        return res.status(200).send({
            isValid
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Failed to verify PIN",
            error: error.message
        });
    }
};

module.exports = { createBankUser, login, setPin, verifyPin }
