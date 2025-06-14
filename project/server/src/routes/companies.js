const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { param, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validationChains } = require('../middleware/validation');
const Company = require('../models/Company');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * @route   POST /api/companies
 * @desc    Create a new company
 * @access  Private
 */
router.post('/', authMiddleware, validationChains.createCompany, async (req, res) => {
    try {
        const { 
            name, description, address, contactEmail, contactPhone, 
            website, domains, departments, qrCodeSettings, authSettings 
        } = req.body;

        // Check for existing company with the same name
        const existingCompany = await Company.findOne({ name });
        if (existingCompany) {
            return res.status(400).json({ 
                success: false, 
                message: 'A company with this name already exists' 
            });
        }

        // Create the new company
        const newCompany = new Company({
            name,
            description,
            address,
            contactEmail,
            contactPhone,
            website,
            domains: domains || [],
            departments: departments || [],
            qrCodeSettings: qrCodeSettings || {},
            authSettings: authSettings || {},
            admins: [req.user.id] // Set current user as admin
        });

        // Add the current user as an admin member
        newCompany.members.push({
            user: req.user.id,
            role: 'admin',
            status: 'approved'
        });

        await newCompany.save();

        // Update the user's company affiliations
        const user = await User.findById(req.user.id);
        if (user) {
            await user.addCompanyAffiliation(newCompany._id, 'admin');
        }

        return res.status(201).json({
            success: true,
            message: 'Company created successfully',
            company: {
                id: newCompany._id,
                name: newCompany.name,
                description: newCompany.description
            }
        });
    } catch (error) {
        console.error('Error creating company:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating company',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/companies
 * @desc    Get all companies (admin only)
 * @access  Private/Admin
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Only allow admin users to see all companies
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const companies = await Company.find()
            .select('name description contactEmail members active')
            .lean();

        return res.json({
            success: true,
            data: companies
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching companies',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/companies/user
 * @desc    Get companies for current user
 * @access  Private
 */
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'companyAffiliations.company',
                select: 'name description contactEmail qrCodeSettings'
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const companies = user.companyAffiliations.map(affiliation => ({
            id: affiliation.company._id,
            name: affiliation.company.name,
            description: affiliation.company.description,
            contactEmail: affiliation.company.contactEmail,
            qrCodeSettings: affiliation.company.qrCodeSettings,
            role: affiliation.role,
            status: affiliation.status,
            isDefault: affiliation.isDefault
        }));

        return res.json({
            success: true,
            data: companies
        });
    } catch (error) {
        console.error('Error fetching user companies:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user companies',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/companies/:id
 * @desc    Get company by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('admins', 'email profile.name')
            .populate('members.user', 'email profile.name');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if user belongs to this company or is a system admin
        const userMember = company.members.find(
            member => member.user._id.toString() === req.user.id
        );

        if (!userMember && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        return res.json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching company',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company details
 * @access  Private/Admin
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if user is company admin
        const isAdmin = company.admins.some(
            admin => admin.toString() === req.user.id
        );

        if (!isAdmin && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only company administrators can update company details'
            });
        }

        const {
            name, description, address, contactEmail, contactPhone,
            website, domains, departments, qrCodeSettings, authSettings
        } = req.body;

        // Update company fields if provided
        if (name) company.name = name;
        if (description) company.description = description;
        if (address) company.address = address;
        if (contactEmail) company.contactEmail = contactEmail;
        if (contactPhone) company.contactPhone = contactPhone;
        if (website) company.website = website;
        if (domains) company.domains = domains;
        if (departments) company.departments = departments;
        if (qrCodeSettings) company.qrCodeSettings = { ...company.qrCodeSettings, ...qrCodeSettings };
        if (authSettings) company.authSettings = { ...company.authSettings, ...authSettings };

        await company.save();

        return res.json({
            success: true,
            message: 'Company updated successfully',
            company: {
                id: company._id,
                name: company.name,
                description: company.description
            }
        });
    } catch (error) {
        console.error('Error updating company:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating company',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/companies/:id/join
 * @desc    Request to join a company
 * @access  Private
 */
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const { department, role } = req.body;
        
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if user is already a member
        const existingMember = company.members.find(
            member => member.user.toString() === req.user.id
        );

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already associated with this company'
            });
        }

        // Add user to company members with pending status
        company.members.push({
            user: req.user.id,
            role: role || 'member',
            department: department || '',
            status: 'pending'
        });

        await company.save();

        // Add company to user's affiliations
        const user = await User.findById(req.user.id);
        if (user) {
            await user.addCompanyAffiliation(company._id, role || 'member', department || '');
        }

        // Email notification to company admins if needed
        // (can be implemented later)

        return res.json({
            success: true,
            message: 'Join request submitted successfully. Awaiting approval.'
        });
    } catch (error) {
        console.error('Error joining company:', error);
        return res.status(500).json({
            success: false,
            message: 'Error joining company',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/companies/:id/members/:userId
 * @desc    Update member status (approve/deny)
 * @access  Private/Admin
 */
router.put('/:id/members/:userId', authMiddleware, async (req, res) => {
    try {
        const { status, role, department } = req.body;
        
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if user is admin of this company
        const isAdmin = company.admins.some(
            admin => admin.toString() === req.user.id
        );

        if (!isAdmin && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only company administrators can update member status'
            });
        }

        // Find and update member
        const memberIndex = company.members.findIndex(
            member => member.user.toString() === req.params.userId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in company'
            });
        }

        if (status) company.members[memberIndex].status = status;
        if (role) company.members[memberIndex].role = role;
        if (department) company.members[memberIndex].department = department;

        await company.save();

        // Update user's affiliation status
        const user = await User.findById(req.params.userId);
        if (user) {
            const affiliationIndex = user.companyAffiliations.findIndex(
                affiliation => affiliation.company.toString() === req.params.id
            );
            
            if (affiliationIndex !== -1) {
                if (status) user.companyAffiliations[affiliationIndex].status = status;
                if (role) user.companyAffiliations[affiliationIndex].role = role;
                if (department) user.companyAffiliations[affiliationIndex].department = department;
                
                await user.save();
            }
        }

        return res.json({
            success: true,
            message: `Member status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating member status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating member status',
            error: error.message
        });
    }
});

module.exports = router;
