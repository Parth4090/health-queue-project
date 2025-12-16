const axios = require('axios');
const crypto = require('crypto');

class NMCVerificationService {
  constructor() {
    // Configuration for different medical councils
    this.councilConfigs = {
      'NMC': {
        name: 'National Medical Commission',
        baseUrl: process.env.NMC_API_URL || 'https://api.nmc.org.in',
        apiKey: process.env.NMC_API_KEY,
        endpoints: {
          verify: '/verify-license',
          search: '/search-doctor'
        }
      },
      'MCI': {
        name: 'Medical Council of India (Legacy)',
        baseUrl: process.env.MCI_API_URL || 'https://api.mciindia.org',
        apiKey: process.env.MCI_API_KEY,
        endpoints: {
          verify: '/verify',
          search: '/search'
        }
      }
    };

    // State medical council configurations
    this.stateCouncils = {
      'MAHARASHTRA': {
        name: 'Maharashtra Medical Council',
        baseUrl: process.env.MMC_API_URL || 'https://api.maharashtramedicalcouncil.org',
        apiKey: process.env.MMC_API_KEY
      },
      'KARNATAKA': {
        name: 'Karnataka Medical Council',
        baseUrl: process.env.KMC_API_URL || 'https://api.karnatakamedicalcouncil.org',
        apiKey: process.env.KMC_API_KEY
      },
      'TAMIL_NADU': {
        name: 'Tamil Nadu Medical Council',
        baseUrl: process.env.TNMC_API_URL || 'https://api.tamilnadumedicalcouncil.org',
        apiKey: process.env.TNMC_API_KEY
      },
      'KERALA': {
        name: 'Kerala Medical Council',
        baseUrl: process.env.KMC_API_URL || 'https://api.keralamedicalcouncil.org',
        apiKey: process.env.KMC_API_KEY
      },
      'ANDHRA_PRADESH': {
        name: 'Andhra Pradesh Medical Council',
        baseUrl: process.env.APMC_API_URL || 'https://api.andhrapradeshmedicalcouncil.org',
        apiKey: process.env.APMC_API_KEY
      },
      'TELANGANA': {
        name: 'Telangana State Medical Council',
        baseUrl: process.env.TSMC_API_URL || 'https://api.telanganamedicalcouncil.org',
        apiKey: process.env.TSMC_API_KEY
      },
      'WEST_BENGAL': {
        name: 'West Bengal Medical Council',
        baseUrl: process.env.WBMC_API_URL || 'https://api.westbengalmedicalcouncil.org',
        apiKey: process.env.WBMC_API_KEY
      },
      'GUJARAT': {
        name: 'Gujarat Medical Council',
        baseUrl: process.env.GMC_API_URL || 'https://api.gujaratmedicalcouncil.org',
        apiKey: process.env.GMC_API_KEY
      },
      'RAJASTHAN': {
        name: 'Rajasthan Medical Council',
        baseUrl: process.env.RMC_API_URL || 'https://api.rajasthanmedicalcouncil.org',
        apiKey: process.env.RMC_API_KEY
      },
      'MADHYA_PRADESH': {
        name: 'Madhya Pradesh Medical Council',
        baseUrl: process.env.MPMC_API_URL || 'https://api.madhyaPradeshmedicalcouncil.org',
        apiKey: process.env.MPMC_API_KEY
      },
      'UTTAR_PRADESH': {
        name: 'Uttar Pradesh Medical Council',
        baseUrl: process.env.UPMC_API_URL || 'https://api.uttarPradeshmedicalcouncil.org',
        apiKey: process.env.UPMC_API_KEY
      },
      'BIHAR': {
        name: 'Bihar Medical Council',
        baseUrl: process.env.BMC_API_URL || 'https://api.biharmedicalcouncil.org',
        apiKey: process.env.BMC_API_KEY
      },
      'ODISHA': {
        name: 'Odisha Medical Council',
        baseUrl: process.env.OMC_API_URL || 'https://api.odishamedicalcouncil.org',
        apiKey: process.env.OMC_API_KEY
      },
      'ASSAM': {
        name: 'Assam Medical Council',
        baseUrl: process.env.AMC_API_URL || 'https://api.assammedicalcouncil.org',
        apiKey: process.env.AMC_API_KEY
      },
      'JHARKHAND': {
        name: 'Jharkhand Medical Council',
        baseUrl: process.env.JMC_API_URL || 'https://api.jharkhandmedicalcouncil.org',
        apiKey: process.env.JMC_API_KEY
      },
      'CHHATTISGARH': {
        name: 'Chhattisgarh Medical Council',
        baseUrl: process.env.CGMC_API_URL || 'https://api.chhattisgarhmedicalcouncil.org',
        apiKey: process.env.CGMC_API_KEY
      },
      'HARYANA': {
        name: 'Haryana Medical Council',
        baseUrl: process.env.HMC_API_URL || 'https://api.haryanamedicalcouncil.org',
        apiKey: process.env.HMC_API_KEY
      },
      'PUNJAB': {
        name: 'Punjab Medical Council',
        baseUrl: process.env.PMC_API_URL || 'https://api.punjabmedicalcouncil.org',
        apiKey: process.env.PMC_API_KEY
      },
      'HIMACHAL_PRADESH': {
        name: 'Himachal Pradesh Medical Council',
        baseUrl: process.env.HPMC_API_URL || 'https://api.himachalpradeshmedicalcouncil.org',
        apiKey: process.env.HPMC_API_KEY
      },
      'UTTARAKHAND': {
        name: 'Uttarakhand Medical Council',
        baseUrl: process.env.UKMC_API_URL || 'https://api.uttarakhandmedicalcouncil.org',
        apiKey: process.env.UKMC_API_KEY
      },
      'DELHI': {
        name: 'Delhi Medical Council',
        baseUrl: process.env.DMC_API_URL || 'https://api.delhimedicalcouncil.org',
        apiKey: process.env.DMC_API_KEY
      }
    };

    // Rate limiting configuration
    this.rateLimit = {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      lastRequest: new Map(),
      requestCount: new Map()
    };
  }

  /**
   * Determine the appropriate medical council based on NMC number format
   */
  determineCouncil(nmcNumber) {
    const cleanNumber = nmcNumber.replace(/[^A-Z0-9]/g, '');
    
    // NMC format: NMC-XXXXX-XXXXX (new format)
    if (cleanNumber.startsWith('NMC') && cleanNumber.length === 15) {
      return 'NMC';
    }
    
    // MCI format: XXXXX (old format)
    if (/^\d{5,6}$/.test(cleanNumber)) {
      return 'MCI';
    }
    
    // State council formats
    if (cleanNumber.startsWith('MAH')) return 'MAHARASHTRA';
    if (cleanNumber.startsWith('KAR')) return 'KARNATAKA';
    if (cleanNumber.startsWith('TAM')) return 'TAMIL_NADU';
    if (cleanNumber.startsWith('KER')) return 'KERALA';
    if (cleanNumber.startsWith('AP')) return 'ANDHRA_PRADESH';
    if (cleanNumber.startsWith('TS')) return 'TELANGANA';
    if (cleanNumber.startsWith('WB')) return 'WEST_BENGAL';
    if (cleanNumber.startsWith('GUJ')) return 'GUJARAT';
    if (cleanNumber.startsWith('RAJ')) return 'RAJASTHAN';
    if (cleanNumber.startsWith('MP')) return 'MADHYA_PRADESH';
    if (cleanNumber.startsWith('UP')) return 'UTTAR_PRADESH';
    if (cleanNumber.startsWith('BIH')) return 'BIHAR';
    if (cleanNumber.startsWith('ODI')) return 'ODISHA';
    if (cleanNumber.startsWith('ASS')) return 'ASSAM';
    if (cleanNumber.startsWith('JHA')) return 'JHARKHAND';
    if (cleanNumber.startsWith('CG')) return 'CHHATTISGARH';
    if (cleanNumber.startsWith('HAR')) return 'HARYANA';
    if (cleanNumber.startsWith('PUN')) return 'PUNJAB';
    if (cleanNumber.startsWith('HP')) return 'HIMACHAL_PRADESH';
    if (cleanNumber.startsWith('UK')) return 'UTTARAKHAND';
    if (cleanNumber.startsWith('DEL')) return 'DELHI';
    
    // Default to NMC for unknown formats
    return 'NMC';
  }

  /**
   * Check rate limiting for API calls
   */
  checkRateLimit(council) {
    const now = Date.now();
    const key = `${council}_${Math.floor(now / 60000)}`; // Per minute
    
    if (!this.rateLimit.requestCount.has(key)) {
      this.rateLimit.requestCount.set(key, 0);
    }
    
    const count = this.rateLimit.requestCount.get(key);
    if (count >= this.rateLimit.requestsPerMinute) {
      throw new Error(`Rate limit exceeded for ${council}. Please try again later.`);
    }
    
    this.rateLimit.requestCount.set(key, count + 1);
    return true;
  }

  /**
   * Verify NMC number against the appropriate medical council
   */
  async verifyNMCNumber(nmcNumber, doctorName = null, dateOfBirth = null) {
    try {
      const council = this.determineCouncil(nmcNumber);
      this.checkRateLimit(council);
      
      console.log(`Verifying NMC number ${nmcNumber} against ${council}`);
      
      let verificationResult;
      
      if (council === 'NMC') {
        verificationResult = await this.verifyAgainstNMC(nmcNumber, doctorName, dateOfBirth);
      } else if (council === 'MCI') {
        verificationResult = await this.verifyAgainstMCI(nmcNumber, doctorName, dateOfBirth);
      } else {
        verificationResult = await this.verifyAgainstStateCouncil(council, nmcNumber, doctorName, dateOfBirth);
      }
      
      return {
        success: true,
        council,
        councilName: this.getCouncilName(council),
        verificationResult,
        verifiedAt: new Date(),
        verificationSource: 'api'
      };
      
    } catch (error) {
      console.error(`NMC verification error for ${nmcNumber}:`, error.message);
      
      // Fallback to manual verification suggestion
      return {
        success: false,
        council: this.determineCouncil(nmcNumber),
        councilName: this.getCouncilName(this.determineCouncil(nmcNumber)),
        error: error.message,
        verificationSource: 'manual_review_required',
        fallbackMessage: 'Unable to verify automatically. Manual verification required.'
      };
    }
  }

  /**
   * Verify against National Medical Commission
   */
  async verifyAgainstNMC(nmcNumber, doctorName, dateOfBirth) {
    const config = this.councilConfigs.NMC;
    
    if (!config.apiKey) {
      throw new Error('NMC API key not configured');
    }
    
    const response = await axios.post(`${config.baseUrl}${config.endpoints.verify}`, {
      licenseNumber: nmcNumber,
      doctorName,
      dateOfBirth
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      return {
        name: response.data.doctorName,
        registrationDate: new Date(response.data.registrationDate),
        expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : null,
        specialization: response.data.specialization,
        status: response.data.status,
        councilName: config.name,
        confidence: response.data.confidence || 95
      };
    } else {
      throw new Error(response.data.message || 'Verification failed');
    }
  }

  /**
   * Verify against Medical Council of India (legacy)
   */
  async verifyAgainstMCI(nmcNumber, doctorName, dateOfBirth) {
    const config = this.councilConfigs.MCI;
    
    if (!config.apiKey) {
      throw new Error('MCI API key not configured');
    }
    
    const response = await axios.post(`${config.baseUrl}${config.endpoints.verify}`, {
      licenseNumber: nmcNumber,
      doctorName,
      dateOfBirth
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      return {
        name: response.data.doctorName,
        registrationDate: new Date(response.data.registrationDate),
        expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : null,
        specialization: response.data.specialization,
        status: response.data.status,
        councilName: config.name,
        confidence: response.data.confidence || 90
      };
    } else {
      throw new Error(response.data.message || 'Verification failed');
    }
  }

  /**
   * Verify against state medical council
   */
  async verifyAgainstStateCouncil(council, nmcNumber, doctorName, dateOfBirth) {
    const config = this.stateCouncils[council];
    
    if (!config) {
      throw new Error(`State council ${council} not configured`);
    }
    
    if (!config.apiKey) {
      throw new Error(`${council} API key not configured`);
    }
    
    const response = await axios.post(`${config.baseUrl}/verify`, {
      licenseNumber: nmcNumber,
      doctorName,
      dateOfBirth
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      return {
        name: response.data.doctorName,
        registrationDate: new Date(response.data.registrationDate),
        expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : null,
        specialization: response.data.specialization,
        status: response.data.status,
        councilName: config.name,
        confidence: response.data.confidence || 85
      };
    } else {
      throw new Error(response.data.message || 'Verification failed');
    }
  }

  /**
   * Get council name
   */
  getCouncilName(council) {
    if (this.councilConfigs[council]) {
      return this.councilConfigs[council].name;
    }
    if (this.stateCouncils[council]) {
      return this.stateCouncils[council].name;
    }
    return 'Unknown Council';
  }

  /**
   * Validate NMC number format
   */
  validateNMCFormat(nmcNumber) {
    const cleanNumber = nmcNumber.replace(/[^A-Z0-9]/g, '');
    
    // NMC format: NMC-XXXXX-XXXXX
    if (/^NMC[A-Z0-9]{10}$/.test(cleanNumber)) {
      return { valid: true, format: 'NMC', council: 'NMC' };
    }
    
    // MCI format: XXXXX (5-6 digits)
    if (/^\d{5,6}$/.test(cleanNumber)) {
      return { valid: true, format: 'MCI', council: 'MCI' };
    }
    
    // State council formats
    const stateFormats = {
      'MAH': /^MAH[A-Z0-9]{8,10}$/,
      'KAR': /^KAR[A-Z0-9]{8,10}$/,
      'TAM': /^TAM[A-Z0-9]{8,10}$/,
      'KER': /^KER[A-Z0-9]{8,10}$/,
      'AP': /^AP[A-Z0-9]{8,10}$/,
      'TS': /^TS[A-Z0-9]{8,10}$/,
      'WB': /^WB[A-Z0-9]{8,10}$/,
      'GUJ': /^GUJ[A-Z0-9]{8,10}$/,
      'RAJ': /^RAJ[A-Z0-9]{8,10}$/,
      'MP': /^MP[A-Z0-9]{8,10}$/,
      'UP': /^UP[A-Z0-9]{8,10}$/,
      'BIH': /^BIH[A-Z0-9]{8,10}$/,
      'ODI': /^ODI[A-Z0-9]{8,10}$/,
      'ASS': /^ASS[A-Z0-9]{8,10}$/,
      'JHA': /^JHA[A-Z0-9]{8,10}$/,
      'CG': /^CG[A-Z0-9]{8,10}$/,
      'HAR': /^HAR[A-Z0-9]{8,10}$/,
      'PUN': /^PUN[A-Z0-9]{8,10}$/,
      'HP': /^HP[A-Z0-9]{8,10}$/,
      'UK': /^UK[A-Z0-9]{8,10}$/,
      'DEL': /^DEL[A-Z0-9]{8,10}$/
    };
    
    for (const [prefix, pattern] of Object.entries(stateFormats)) {
      if (pattern.test(cleanNumber)) {
        return { valid: true, format: 'STATE', council: prefix };
      }
    }
    
    return { valid: false, format: 'UNKNOWN', council: 'UNKNOWN' };
  }

  /**
   * Generate hash for sensitive data (Aadhaar, PAN)
   */
  generateHash(data) {
    return crypto.createHash('sha256').update(data.toString()).digest('hex');
  }

  /**
   * Check if NMC number is already verified in our system
   */
  async checkDuplicateNMC(nmcNumber) {
    // This would typically check against your database
    // For now, return false (no duplicate)
    return false;
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    return {
      totalCouncils: Object.keys(this.stateCouncils).length + Object.keys(this.councilConfigs).length,
      supportedStates: Object.keys(this.stateCouncils),
      nationalCouncils: Object.keys(this.councilConfigs),
      rateLimitPerMinute: this.rateLimit.requestsPerMinute,
      rateLimitPerHour: this.rateLimit.requestsPerHour
    };
  }
}

module.exports = new NMCVerificationService();
