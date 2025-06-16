const mongoose = require('mongoose');
const { generateCompanyCode } = require('../utils/companyCodeGenerator');

const CompanySchema = new mongoose.Schema({    
    code: {
        type: String,
        required: true,
        unique: true,
        default: generateCompanyCode
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    contactEmail: {
        type: String,
        required: true
    },
    contactPhone: String,
    website: String,
    // Company structure
    departments: [{
        name: String,
        description: String
    }],
    // Company domain(s) for email verification
    domains: [{
        type: String
    }],
    // QR code settings for this company
    qrCodeSettings: {
        logo: String,
        primaryColor: String,
        secondaryColor: String,
        template: {
            type: String,
            default: 'default'
        }
    },
    // Authorization settings
    authSettings: {
        requireEmailVerification: {
            type: Boolean,
            default: true
        },
        require2FA: {
            type: Boolean,
            default: false
        },
        autoApproveMembers: {
            type: Boolean,
            default: false
        }
    },
    // Company admins who can manage company settings
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Company members
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'librarian', 'associate', 'member'],
            default: 'member'
        },
        department: String,
        joinDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending'
        }
    }],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
CompanySchema.index({ name: 1 });
// Note: code field already has unique:true, so no need for separate index
CompanySchema.index({ 'members.user': 1 });
CompanySchema.index({ 'members.status': 1 });
CompanySchema.index({ 'domains': 1 });

// Pre-save hook to ensure company code is set
CompanySchema.pre('save', function(next) {
    if (!this.code) {
        this.code = generateCompanyCode();
    }
    next();
});

module.exports = mongoose.model('Company', CompanySchema);
