const axios = require('axios');

class AzureComputerVision {
  constructor() {
    this.endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    this.apiKey = process.env.AZURE_COMPUTER_VISION_API_KEY;
    
    if (!this.endpoint || !this.apiKey) {
      console.warn('Azure Computer Vision credentials not found. Using mock analysis.');
      this.isConfigured = false;
      return;
    }
    
    this.isConfigured = true;
    this.analyzeUrl = `${this.endpoint}/vision/v3.2/analyze`;
  }

  async analyzeVehicleDamage(imageUrl) {
    if (!this.isConfigured) {
      return this.generateMockAnalysis();
    }

    try {
      const response = await axios.post(
        this.analyzeUrl,
        { url: imageUrl },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          params: {
            visualFeatures: 'Categories,Description,Objects,Tags'
          }
        }
      );

      return this.processAnalysisResult(response.data);
    } catch (error) {
      console.error('Error analyzing image with Azure Computer Vision:', error.message);
      return this.generateMockAnalysis();
    }
  }

  processAnalysisResult(analysisData) {
    const description = analysisData.description?.captions?.[0]?.text || '';
    const tags = analysisData.tags?.map(tag => tag.name) || [];
    const objects = analysisData.objects?.map(obj => obj.object) || [];

    const severity = this.determineSeverity(description, tags, objects);
    const confidence = analysisData.description?.captions?.[0]?.confidence || 0.7;

    return {
      severity,
      confidence,
      description,
      damageTypes: this.extractDamageTypes(tags, objects),
      analysisDetails: {
        tags: tags.slice(0, 10),
        objects,
        description
      }
    };
  }

  determineSeverity(description, tags, objects) {
    const text = `${description} ${tags.join(' ')} ${objects.join(' ')}`.toLowerCase();
    
    const severeKeywords = [
      'crashed', 'destroyed', 'totaled', 'severe', 'major', 'extensive',
      'crushed', 'mangled', 'shattered', 'broken', 'smashed'
    ];
    
    const moderateKeywords = [
      'damaged', 'dented', 'scratched', 'bent', 'cracked', 'moderate',
      'medium', 'significant', 'noticeable'
    ];
    
    const minorKeywords = [
      'minor', 'small', 'light', 'superficial', 'tiny', 'slight'
    ];

    if (severeKeywords.some(keyword => text.includes(keyword))) {
      return 'severe';
    } else if (moderateKeywords.some(keyword => text.includes(keyword))) {
      return 'moderate';
    } else if (minorKeywords.some(keyword => text.includes(keyword))) {
      return 'minor';
    }

    const vehicleObjects = objects.filter(obj => 
      ['car', 'vehicle', 'truck', 'automobile'].includes(obj.toLowerCase())
    );

    if (vehicleObjects.length > 0) {
      return 'moderate';
    }

    return 'minor';
  }

  extractDamageTypes(tags, objects) {
    const damageTypes = [];
    const allItems = [...tags, ...objects].map(item => item.toLowerCase());

    const damageMap = {
      'dent': ['dent', 'dented', 'depression'],
      'scratch': ['scratch', 'scratched', 'scrape'],
      'crack': ['crack', 'cracked', 'split'],
      'break': ['broken', 'shattered', 'smashed'],
      'rust': ['rust', 'corrosion', 'oxidation'],
      'paint damage': ['paint', 'color', 'coating']
    };

    Object.entries(damageMap).forEach(([damageType, keywords]) => {
      if (keywords.some(keyword => allItems.some(item => item.includes(keyword)))) {
        damageTypes.push(damageType);
      }
    });

    return damageTypes.length > 0 ? damageTypes : ['general damage'];
  }

  generateMockAnalysis() {
    const severities = ['minor', 'moderate', 'severe'];
    const damageTypes = ['dent', 'scratch', 'paint damage', 'crack'];
    
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const selectedDamageTypes = damageTypes
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);

    const confidence = 0.75 + Math.random() * 0.2;

    return {
      severity,
      confidence,
      description: `Vehicle with ${severity} damage detected`,
      damageTypes: selectedDamageTypes,
      analysisDetails: {
        tags: ['vehicle', 'car', 'damage', severity],
        objects: ['car'],
        description: `Mock analysis: ${severity} vehicle damage`
      },
      isMockData: true
    };
  }
}

const azureComputerVision = new AzureComputerVision();

const analyzeImage = async (imageUrl) => {
  try {
    return await azureComputerVision.analyzeVehicleDamage(imageUrl);
  } catch (error) {
    console.error('Error in image analysis:', error);
    return azureComputerVision.generateMockAnalysis();
  }
};

module.exports = {
  analyzeImage,
  AzureComputerVision
};
