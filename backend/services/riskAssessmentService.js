const crypto = require('crypto');
const axios = require('axios');

class RiskAssessmentService {
  constructor() {
    // Risk scoring weights
    this.riskWeights = {
      duplicateAccounts: 25,
      disposableEmail: 20,
      phoneValidation: 15,
      consultationFee: 10,
      documentAuthenticity: 20,
      locationRisk: 10
    };

    // Risk thresholds
    this.riskThresholds = {
      low: 0,
      medium: 30,
      high: 60,
      critical: 80
    };

    // Consultation fee ranges by specialization (in INR)
    this.consultationFeeRanges = {
      'General Medicine': { min: 200, max: 1500 },
      'Cardiology': { min: 500, max: 3000 },
      'Neurology': { min: 800, max: 4000 },
      'Orthopedics': { min: 400, max: 2500 },
      'Dermatology': { min: 300, max: 2000 },
      'Pediatrics': { min: 200, max: 1200 },
      'Gynecology': { min: 400, max: 2500 },
      'Psychiatry': { min: 500, max: 3000 },
      'Ophthalmology': { min: 300, max: 2000 },
      'ENT': { min: 300, max: 2000 },
      'Dentistry': { min: 200, max: 1500 },
      'Physiotherapy': { min: 200, max: 1000 },
      'Ayurveda': { min: 100, max: 800 },
      'Homeopathy': { min: 100, max: 600 },
      'Unani': { min: 100, max: 600 }
    };

    // High-risk locations (areas with known fraud patterns)
    this.highRiskLocations = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
      'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow'
    ];

    // Disposable email providers
    this.disposableEmailProviders = [
      'tempmail.org', 'guerrillamail.com', '10minutemail.com',
      'mailinator.com', 'throwawaymail.com', 'mailnesia.com',
      'yopmail.com', 'getnada.com', 'sharklasers.com',
      'maildrop.cc', 'mailcatch.com', 'spam4.me'
    ];

    // Suspicious phone patterns
    this.suspiciousPhonePatterns = [
      /^\+91[0-9]{10}$/, // Valid Indian format
      /^[0-9]{10}$/,      // Valid Indian format without country code
      /^[0-9]{12}$/       // Valid Indian format with country code
    ];
  }

  /**
   * Perform comprehensive risk assessment
   */
  async assessRisk(doctorData, existingUsers = []) {
    try {
      const riskFactors = [];
      let totalRiskScore = 0;

      // 1. Duplicate account detection
      const duplicateRisk = await this.checkDuplicateAccounts(doctorData, existingUsers);
      riskFactors.push(duplicateRisk);
      totalRiskScore += duplicateRisk.score;

      // 2. Email validation
      const emailRisk = this.validateEmail(doctorData.email);
      riskFactors.push(emailRisk);
      totalRiskScore += emailRisk.score;

      // 3. Phone validation
      const phoneRisk = this.validatePhone(doctorData.phone);
      riskFactors.push(phoneRisk);
      totalRiskScore += phoneRisk.score;

      // 4. Consultation fee validation
      const feeRisk = this.validateConsultationFee(doctorData.consultationFee, doctorData.specialization);
      riskFactors.push(feeRisk);
      totalRiskScore += feeRisk.score;

      // 5. Location risk assessment
      const locationRisk = this.assessLocationRisk(doctorData.city, doctorData.state);
      riskFactors.push(locationRisk);
      totalRiskScore += locationRisk.score;

      // 6. Document authenticity (placeholder for OCR results)
      const documentRisk = this.assessDocumentAuthenticity(doctorData.documents || []);
      riskFactors.push(documentRisk);
      totalRiskScore += documentRisk.score;

      // 7. NMC number validation
      const nmcRisk = this.validateNMCNumber(doctorData.nmcNumber);
      riskFactors.push(nmcRisk);
      totalRiskScore += nmcRisk.score;

      // 8. Age and experience validation
      const ageExperienceRisk = this.validateAgeAndExperience(doctorData.dateOfBirth, doctorData.experience);
      riskFactors.push(ageExperienceRisk);
      totalRiskScore += ageExperienceRisk.score;

      // Determine risk level
      const riskLevel = this.determineRiskLevel(totalRiskScore);

      // Calculate next assessment date
      const nextAssessmentDate = this.calculateNextAssessmentDate(riskLevel);

      return {
        overallRiskScore: Math.min(totalRiskScore, 100),
        riskLevel,
        riskFactors,
        assessmentDate: new Date(),
        nextAssessmentDate,
        automatedChecks: {
          duplicateAccounts: duplicateRisk,
          disposableEmail: emailRisk,
          phoneValidation: phoneRisk,
          consultationFeeValidation: feeRisk,
          documentAuthenticity: documentRisk,
          locationRisk: locationRisk,
          nmcValidation: nmcRisk,
          ageExperienceValidation: ageExperienceRisk
        },
        recommendations: this.generateRecommendations(riskLevel, riskFactors),
        requiresManualReview: riskLevel === 'high' || riskLevel === 'critical'
      };

    } catch (error) {
      console.error('Risk assessment error:', error);
      return {
        overallRiskScore: 100,
        riskLevel: 'critical',
        riskFactors: [{
          factor: 'assessment_error',
          score: 100,
          description: 'Risk assessment failed',
          severity: 'critical'
        }],
        assessmentDate: new Date(),
        nextAssessmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        error: error.message,
        requiresManualReview: true
      };
    }
  }

  /**
   * Check for duplicate accounts
   */
  async checkDuplicateAccounts(doctorData, existingUsers) {
    const duplicates = [];
    let riskScore = 0;

    // Check by email
    const emailDuplicate = existingUsers.find(user => 
      user.email.toLowerCase() === doctorData.email.toLowerCase()
    );
    if (emailDuplicate) {
      duplicates.push({
        type: 'email',
        userId: emailDuplicate._id,
        details: 'Email already registered'
      });
      riskScore += 25;
    }

    // Check by phone
    const phoneDuplicate = existingUsers.find(user => 
      user.phone === doctorData.phone
    );
    if (phoneDuplicate) {
      duplicates.push({
        type: 'phone',
        userId: phoneDuplicate._id,
        details: 'Phone number already registered'
      });
      riskScore += 20;
    }

    // Check by NMC number
    const nmcDuplicate = existingUsers.find(user => 
      user.nmcNumber === doctorData.nmcNumber
    );
    if (nmcDuplicate) {
      duplicates.push({
        type: 'nmc_number',
        userId: nmcDuplicate._id,
        details: 'NMC number already registered'
      });
      riskScore += 30;
    }

    // Check by name similarity (fuzzy matching)
    const nameSimilarity = this.checkNameSimilarity(doctorData.name, existingUsers);
    if (nameSimilarity.score > 0.8) {
      duplicates.push({
        type: 'name_similarity',
        userId: nameSimilarity.userId,
        details: `High name similarity (${Math.round(nameSimilarity.score * 100)}%)`
      });
      riskScore += 15;
    }

    return {
      factor: 'duplicate_accounts',
      score: Math.min(riskScore, 100),
      description: `Found ${duplicates.length} potential duplicate(s)`,
      severity: duplicates.length > 0 ? 'high' : 'low',
      detected: duplicates.length > 0,
      count: duplicates.length,
      details: duplicates
    };
  }

  /**
   * Validate email for disposable providers
   */
  validateEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    const isDisposable = this.disposableEmailProviders.includes(domain);
    
    return {
      factor: 'disposable_email',
      score: isDisposable ? 20 : 0,
      description: isDisposable ? 'Disposable email detected' : 'Valid email provider',
      severity: isDisposable ? 'medium' : 'low',
      detected: isDisposable,
      provider: domain,
      risk: isDisposable ? 'Disposable emails often used for fraud' : 'Low risk'
    };
  }

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    let isValid = false;
    let carrier = 'Unknown';
    let risk = 'Unknown';

    // Check against patterns
    for (const pattern of this.suspiciousPhonePatterns) {
      if (pattern.test(cleanPhone)) {
        isValid = true;
        break;
      }
    }

    // Basic carrier detection (simplified)
    if (cleanPhone.startsWith('+91')) {
      const prefix = cleanPhone.substring(3, 5);
      if (['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'].includes(prefix)) {
        carrier = 'Jio';
        risk = 'Low';
      } else if (['80', '81', '82', '83', '84', '85', '86', '87', '88', '89'].includes(prefix)) {
        carrier = 'Airtel';
        risk = 'Low';
      } else if (['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(prefix)) {
        carrier = 'BSNL';
        risk = 'Low';
      }
    }

    return {
      factor: 'phone_validation',
      score: isValid ? 0 : 15,
      description: isValid ? 'Valid phone number' : 'Invalid phone format',
      severity: isValid ? 'low' : 'medium',
      valid: isValid,
      carrier,
      risk
    };
  }

  /**
   * Validate consultation fee
   */
  validateConsultationFee(fee, specialization) {
    const range = this.consultationFeeRanges[specialization] || 
                  this.consultationFeeRanges['General Medicine'];
    
    const isWithinRange = fee >= range.min && fee <= range.max;
    let riskScore = 0;
    let risk = 'Low';

    if (!isWithinRange) {
      if (fee < range.min) {
        riskScore = 5;
        risk = 'Suspiciously low fee';
      } else if (fee > range.max) {
        riskScore = 10;
        risk = 'Unusually high fee';
      }
    }

    return {
      factor: 'consultation_fee_validation',
      score: riskScore,
      description: isWithinRange ? 'Fee within expected range' : 'Fee outside expected range',
      severity: riskScore > 0 ? 'medium' : 'low',
      withinRange: isWithinRange,
      expectedRange: `₹${range.min} - ₹${range.max}`,
      risk
    };
  }

  /**
   * Assess location risk
   */
  assessLocationRisk(city, state) {
    const isHighRiskLocation = this.highRiskLocations.includes(city);
    
    return {
      factor: 'location_risk',
      score: isHighRiskLocation ? 10 : 0,
      description: isHighRiskLocation ? 'High-risk location detected' : 'Low-risk location',
      severity: isHighRiskLocation ? 'medium' : 'low',
      city,
      state,
      risk: isHighRiskLocation ? 'High fraud activity in this area' : 'Low fraud activity'
    };
  }

  /**
   * Assess document authenticity (placeholder for OCR integration)
   */
  assessDocumentAuthenticity(documents) {
    if (!documents || documents.length === 0) {
      return {
        factor: 'document_authenticity',
        score: 20,
        description: 'No documents provided',
        severity: 'medium',
        score: 0,
        analysis: 'Documents required for verification'
      };
    }

    // This would integrate with OCR and AI analysis
    // For now, return a basic assessment
    return {
      factor: 'document_authenticity',
      score: 0,
      description: 'Documents provided for verification',
      severity: 'low',
      score: 0,
      analysis: 'Manual review required for document authenticity'
    };
  }

  /**
   * Validate NMC number format
   */
  validateNMCNumber(nmcNumber) {
    if (!nmcNumber) {
      return {
        factor: 'nmc_validation',
        score: 30,
        description: 'NMC number not provided',
        severity: 'high',
        valid: false,
        risk: 'NMC number is mandatory for doctor verification'
      };
    }

    // Basic format validation
    const cleanNumber = nmcNumber.replace(/[^A-Z0-9]/g, '');
    const isValid = cleanNumber.length >= 5 && cleanNumber.length <= 15;

    return {
      factor: 'nmc_validation',
      score: isValid ? 0 : 20,
      description: isValid ? 'Valid NMC format' : 'Invalid NMC format',
      severity: isValid ? 'low' : 'medium',
      valid: isValid,
      risk: isValid ? 'Low risk' : 'Format validation failed'
    };
  }

  /**
   * Validate age and experience consistency
   */
  validateAgeAndExperience(dateOfBirth, experience) {
    if (!dateOfBirth || !experience) {
      return {
        factor: 'age_experience_validation',
        score: 15,
        description: 'Missing age or experience data',
        severity: 'medium',
        valid: false,
        risk: 'Cannot validate age-experience consistency'
      };
    }

    const age = this.calculateAge(dateOfBirth);
    const minAgeForExperience = 22; // Minimum age to start medical practice
    const maxAgeForExperience = 80; // Maximum reasonable age

    let riskScore = 0;
    let risk = 'Low';

    if (age < minAgeForExperience) {
      riskScore += 20;
      risk = 'Age too young for claimed experience';
    } else if (age > maxAgeForExperience) {
      riskScore += 15;
      risk = 'Age too high for active practice';
    }

    if (experience > (age - minAgeForExperience)) {
      riskScore += 25;
      risk = 'Experience exceeds possible years';
    }

    return {
      factor: 'age_experience_validation',
      score: riskScore,
      description: riskScore > 0 ? 'Age-experience mismatch detected' : 'Age-experience consistent',
      severity: riskScore > 0 ? 'high' : 'low',
      valid: riskScore === 0,
      age,
      experience,
      risk
    };
  }

  /**
   * Check name similarity using basic algorithm
   */
  checkNameSimilarity(name1, existingUsers) {
    let highestSimilarity = { score: 0, userId: null };

    for (const user of existingUsers) {
      const similarity = this.calculateNameSimilarity(name1, user.name);
      if (similarity > highestSimilarity.score) {
        highestSimilarity = { score: similarity, userId: user._id };
      }
    }

    return highestSimilarity;
  }

  /**
   * Calculate name similarity (simplified Jaro-Winkler)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const clean1 = name1.toLowerCase().replace(/[^a-z]/g, '');
    const clean2 = name2.toLowerCase().replace(/[^a-z]/g, '');
    
    if (clean1 === clean2) return 1.0;
    
    // Simple character-based similarity
    const longer = clean1.length > clean2.length ? clean1 : clean2;
    const shorter = clean1.length > clean2.length ? clean2 : clean1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Determine risk level based on score
   */
  determineRiskLevel(score) {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate next assessment date based on risk level
   */
  calculateNextAssessmentDate(riskLevel) {
    const daysToNextAssessment = {
      'low': 30,
      'medium': 15,
      'high': 7,
      'critical': 3
    };
    
    const days = daysToNextAssessment[riskLevel] || 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Generate recommendations based on risk assessment
   */
  generateRecommendations(riskLevel, riskFactors) {
    const recommendations = [];
    
    if (riskLevel === 'critical') {
      recommendations.push('Immediate manual review required');
      recommendations.push('Consider temporary suspension');
      recommendations.push('Request additional verification documents');
    } else if (riskLevel === 'high') {
      recommendations.push('Manual review recommended');
      recommendations.push('Request clarification on risk factors');
      recommendations.push('Enhanced monitoring required');
    } else if (riskLevel === 'medium') {
      recommendations.push('Standard review process');
      recommendations.push('Monitor for changes in risk factors');
    } else {
      recommendations.push('Standard verification process');
      recommendations.push('Routine monitoring');
    }
    
    // Add specific recommendations based on risk factors
    riskFactors.forEach(factor => {
      if (factor.score > 0) {
        switch (factor.factor) {
          case 'duplicate_accounts':
            recommendations.push('Investigate potential duplicate accounts');
            break;
          case 'disposable_email':
            recommendations.push('Request alternative email address');
            break;
          case 'phone_validation':
            recommendations.push('Verify phone number authenticity');
            break;
          case 'consultation_fee_validation':
            recommendations.push('Review consultation fee justification');
            break;
          case 'nmc_validation':
            recommendations.push('Verify NMC number with medical council');
            break;
        }
      }
    });
    
    return recommendations;
  }

  /**
   * Get risk assessment statistics
   */
  async getRiskStats() {
    return {
      riskLevels: this.riskThresholds,
      riskWeights: this.riskWeights,
      consultationFeeRanges: this.consultationFeeRanges,
      highRiskLocations: this.highRiskLocations,
      disposableEmailProviders: this.disposableEmailProviders.length,
      supportedSpecializations: Object.keys(this.consultationFeeRanges).length
    };
  }
}

module.exports = new RiskAssessmentService();
