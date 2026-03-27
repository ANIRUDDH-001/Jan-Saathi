import type { Scheme } from '../context/AppContext';

export const mockSchemes: Scheme[] = [
  {
    id: '1', slug: 'pm-kisan', name: 'PM-KISAN Samman Nidhi', nameHi: 'पीएम-किसान सम्मान निधि',
    ministry: 'Ministry of Agriculture', ministryHi: 'कृषि मंत्रालय', domain: 'Agriculture',
    benefit: 6000, matchConfidence: 0.95,
    description: 'Direct income support of ₹6,000 per year to small and marginal farmer families with cultivable land holding.',
    descriptionHi: 'छोटे और सीमांत किसान परिवारों को ₹6,000 प्रति वर्ष की प्रत्यक्ष आय सहायता।',
    eligibility: [
      { criterion: 'Annual income below ₹2,00,000', criterionHi: 'सालाना आय ₹2,00,000 से कम', matched: true },
      { criterion: 'Must own cultivable land', criterionHi: 'कृषि योग्य भूमि होनी चाहिए', matched: true },
      { criterion: 'Indian citizen', criterionHi: 'भारतीय नागरिक', matched: true },
    ],
    documents: [
      { name: 'Aadhaar Card', nameHi: 'आधार कार्ड', source: 'UIDAI center', sourceHi: 'UIDAI केंद्र' },
      { name: 'Land ownership papers', nameHi: 'भूमि स्वामित्व पत्र', source: 'Tehsil office', sourceHi: 'तहसील कार्यालय' },
      { name: 'Bank passbook', nameHi: 'बैंक पासबुक', source: 'Your bank', sourceHi: 'आपका बैंक' },
    ],
    steps: [
      { step: 'Visit your nearest CSC center or go to pmkisan.gov.in', stepHi: 'अपने निकटतम CSC केंद्र पर जाएं या pmkisan.gov.in पर जाएं' },
      { step: 'Fill out the registration form with Aadhaar and land details', stepHi: 'आधार और भूमि विवरण के साथ पंजीकरण फॉर्म भरें' },
      { step: 'Submit land ownership documents', stepHi: 'भूमि स्वामित्व दस्तावेज जमा करें' },
      { step: 'Wait for verification by State Nodal Officer', stepHi: 'राज्य नोडल अधिकारी द्वारा सत्यापन की प्रतीक्षा करें' },
    ],
    officeType: 'Common Service Center (CSC)', officeTypeHi: 'जन सेवा केंद्र (CSC)',
    applyUrl: 'https://pmkisan.gov.in',
  },
  {
    id: '2', slug: 'ayushman-bharat', name: 'Ayushman Bharat - PMJAY', nameHi: 'आयुष्मान भारत - पीएमजेएवाई',
    ministry: 'Ministry of Health', ministryHi: 'स्वास्थ्य मंत्रालय', domain: 'Health',
    benefit: 500000, matchConfidence: 0.88,
    description: 'Health insurance coverage of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    descriptionHi: 'माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार ₹5 लाख प्रति वर्ष का स्वास्थ्य बीमा।',
    eligibility: [
      { criterion: 'BPL card holder', criterionHi: 'BPL कार्ड धारक', matched: true },
      { criterion: 'Family in SECC database', criterionHi: 'SECC डेटाबेस में परिवार', matched: true },
    ],
    documents: [
      { name: 'Aadhaar Card', nameHi: 'आधार कार्ड', source: 'UIDAI center', sourceHi: 'UIDAI केंद्र' },
      { name: 'Ration Card / BPL Card', nameHi: 'राशन कार्ड / BPL कार्ड', source: 'Food department', sourceHi: 'खाद्य विभाग' },
    ],
    steps: [
      { step: 'Check eligibility at mera.pmjay.gov.in', stepHi: 'mera.pmjay.gov.in पर पात्रता जांचें' },
      { step: 'Visit empaneled hospital with Aadhaar', stepHi: 'आधार के साथ सूचीबद्ध अस्पताल जाएं' },
      { step: 'Get Ayushman card at hospital Ayushman Mitra desk', stepHi: 'अस्पताल के आयुष्मान मित्र डेस्क पर कार्ड बनवाएं' },
    ],
    officeType: 'Empaneled Hospital', officeTypeHi: 'सूचीबद्ध अस्पताल',
    applyUrl: 'https://pmjay.gov.in',
  },
  {
    id: '3', slug: 'pm-awas-yojana', name: 'PM Awas Yojana (Gramin)', nameHi: 'पीएम आवास योजना (ग्रामीण)',
    ministry: 'Ministry of Rural Development', ministryHi: 'ग्रामीण विकास मंत्रालय', domain: 'Social welfare',
    benefit: 120000, matchConfidence: 0.82,
    description: 'Financial assistance for construction of pucca house to eligible rural households.',
    descriptionHi: 'पात्र ग्रामीण परिवारों को पक्के मकान के निर्माण के लिए वित्तीय सहायता।',
    eligibility: [
      { criterion: 'Houseless or living in kutcha house', criterionHi: 'बेघर या कच्चे मकान में रहने वाले', matched: true },
      { criterion: 'BPL category', criterionHi: 'BPL श्रेणी', matched: true },
    ],
    documents: [
      { name: 'Aadhaar Card', nameHi: 'आधार कार्ड', source: 'UIDAI center', sourceHi: 'UIDAI केंद्र' },
      { name: 'BPL certificate', nameHi: 'BPL प्रमाण पत्र', source: 'Block office', sourceHi: 'ब्लॉक कार्यालय' },
      { name: 'Income certificate', nameHi: 'आय प्रमाण पत्र', source: 'Tehsil office', sourceHi: 'तहसील कार्यालय' },
    ],
    steps: [
      { step: 'Contact Gram Panchayat or Block Development Office', stepHi: 'ग्राम पंचायत या खंड विकास कार्यालय से संपर्क करें' },
      { step: 'Submit application with required documents', stepHi: 'आवश्यक दस्तावेजों के साथ आवेदन जमा करें' },
      { step: 'Await survey and verification', stepHi: 'सर्वेक्षण और सत्यापन की प्रतीक्षा करें' },
    ],
    officeType: 'Gram Panchayat Office', officeTypeHi: 'ग्राम पंचायत कार्यालय',
  },
  {
    id: '4', slug: 'sukanya-samriddhi', name: 'Sukanya Samriddhi Yojana', nameHi: 'सुकन्या समृद्धि योजना',
    ministry: 'Ministry of Finance', ministryHi: 'वित्त मंत्रालय', domain: 'Education',
    benefit: 15000, matchConfidence: 0.75,
    description: 'Savings scheme for girl child with high interest rate and tax benefits. Can be used for education and marriage expenses.',
    descriptionHi: 'बालिकाओं के लिए उच्च ब्याज दर और कर लाभ वाली बचत योजना।',
    eligibility: [
      { criterion: 'Girl child below 10 years', criterionHi: '10 वर्ष से कम की बालिका', matched: false },
      { criterion: 'Indian resident', criterionHi: 'भारतीय निवासी', matched: true },
    ],
    documents: [
      { name: 'Birth certificate of girl child', nameHi: 'बालिका का जन्म प्रमाणपत्र', source: 'Municipal office', sourceHi: 'नगरपालिका कार्यालय' },
      { name: 'Aadhaar of parent/guardian', nameHi: 'माता-पिता का आधार', source: 'UIDAI center', sourceHi: 'UIDAI केंद्र' },
    ],
    steps: [
      { step: 'Visit nearest post office or authorized bank', stepHi: 'निकटतम डाकघर या अधिकृत बैंक जाएं' },
      { step: 'Fill account opening form', stepHi: 'खाता खोलने का फॉर्म भरें' },
      { step: 'Deposit minimum ₹250', stepHi: 'न्यूनतम ₹250 जमा करें' },
    ],
    officeType: 'Post Office / Bank', officeTypeHi: 'डाकघर / बैंक',
  },
  {
    id: '5', slug: 'mgnrega', name: 'MGNREGA', nameHi: 'मनरेगा',
    ministry: 'Ministry of Rural Development', ministryHi: 'ग्रामीण विकास मंत्रालय', domain: 'Employment',
    benefit: 25000, matchConfidence: 0.9,
    description: 'Guarantees 100 days of wage employment per year to every rural household whose adult members volunteer to do unskilled manual work.',
    descriptionHi: 'प्रत्येक ग्रामीण परिवार को प्रति वर्ष 100 दिन के वेतन रोजगार की गारंटी।',
    eligibility: [
      { criterion: 'Rural household', criterionHi: 'ग्रामीण परिवार', matched: true },
      { criterion: 'Adult willing to do manual work', criterionHi: 'मैनुअल काम करने को तैयार वयस्क', matched: true },
    ],
    documents: [
      { name: 'Aadhaar Card', nameHi: 'आधार कार्ड', source: 'UIDAI center', sourceHi: 'UIDAI केंद्र' },
      { name: 'Photograph', nameHi: 'फोटो', source: 'Any photo studio', sourceHi: 'कोई भी फोटो स्टूडियो' },
    ],
    steps: [
      { step: 'Apply at Gram Panchayat for Job Card', stepHi: 'ग्राम पंचायत में जॉब कार्ड के लिए आवेदन करें' },
      { step: 'Receive Job Card within 15 days', stepHi: '15 दिनों में जॉब कार्ड प्राप्त करें' },
      { step: 'Apply for work when needed', stepHi: 'ज़रूरत पड़ने पर काम के लिए आवेदन करें' },
    ],
    officeType: 'Gram Panchayat', officeTypeHi: 'ग्राम पंचायत',
  },
];

export const mockAdminStats = {
  sessionsToday: 1247,
  totalGap: 23450000,
  schemesInDb: 534,
  pendingReview: 12,
};

export const mockTopSchemes = [
  { rank: 1, name: 'PM-KISAN', ministry: 'Agriculture', matchCount: 342, avgBenefit: 6000 },
  { rank: 2, name: 'Ayushman Bharat', ministry: 'Health', matchCount: 287, avgBenefit: 500000 },
  { rank: 3, name: 'MGNREGA', ministry: 'Rural Development', matchCount: 256, avgBenefit: 25000 },
  { rank: 4, name: 'PM Awas Yojana', ministry: 'Rural Development', matchCount: 198, avgBenefit: 120000 },
  { rank: 5, name: 'Sukanya Samriddhi', ministry: 'Finance', matchCount: 145, avgBenefit: 15000 },
  { rank: 6, name: 'PM Ujjwala', ministry: 'Petroleum', matchCount: 134, avgBenefit: 1800 },
  { rank: 7, name: 'PM Mudra Yojana', ministry: 'Finance', matchCount: 112, avgBenefit: 50000 },
  { rank: 8, name: 'Atal Pension Yojana', ministry: 'Finance', matchCount: 98, avgBenefit: 60000 },
  { rank: 9, name: 'PM Fasal Bima', ministry: 'Agriculture', matchCount: 87, avgBenefit: 25000 },
  { rank: 10, name: 'Stand Up India', ministry: 'Finance', matchCount: 76, avgBenefit: 100000 },
];

export const mockGapData = [
  { id: 'mon', day: 'Mon', value: 3200000 },
  { id: 'tue', day: 'Tue', value: 4100000 },
  { id: 'wed', day: 'Wed', value: 3800000 },
  { id: 'thu', day: 'Thu', value: 4500000 },
  { id: 'fri', day: 'Fri', value: 3900000 },
  { id: 'sat', day: 'Sat', value: 2100000 },
  { id: 'sun', day: 'Sun', value: 1800000 },
];

export const mockRecentSessions = Array.from({ length: 15 }, (_, i) => ({
  id: `sess-${String(i + 1).padStart(4, '0')}`,
  state: ['Uttar Pradesh', 'Rajasthan', 'Bihar', 'Maharashtra', 'Madhya Pradesh'][i % 5],
  fieldsCount: Math.floor(Math.random() * 4) + 4,
  schemesMatched: Math.floor(Math.random() * 8) + 1,
  timestamp: new Date(Date.now() - i * 3600000).toLocaleString(),
}));

export const mockPipelineQueue = [
  { id: '1', schemeName: 'Indira Gandhi Pension', ministry: 'Social Justice', failReasons: ['missing_eligibility', 'low_confidence'], pdf: 'igp_scheme_2024.pdf' },
  { id: '2', schemeName: 'Kisan Credit Card', ministry: 'Agriculture', failReasons: ['zero_benefit'], pdf: 'kcc_circular.pdf' },
  { id: '3', schemeName: 'PM Vishwakarma', ministry: 'MSME', failReasons: ['no_steps'], pdf: 'vishwakarma_guidelines.pdf' },
];

// Simulated bot responses
export const botResponses = [
  { trigger: 'farmer', profile: { occupation: 'Farmer', state: 'Uttar Pradesh', income: '₹80,000', age: '45', category: 'OBC', bpl: 'Yes', gender: 'Male' },
    en: "I can see you're a farmer in UP earning ₹80,000/year. Let me find the schemes you qualify for. I've found 5 schemes worth ₹6,66,000 per year!",
    hi: "मैं देख सकता हूं कि आप UP में ₹80,000/वर्ष कमाने वाले किसान हैं। मैं आपके लिए योजनाएं ढूंढता हूं। मैंने ₹6,66,000 प्रति वर्ष की 5 योजनाएं खोजी हैं!" },
  { trigger: 'pregnant', profile: { occupation: 'Homemaker', state: 'Rajasthan', income: '₹60,000', age: '28', category: 'SC', bpl: 'Yes', gender: 'Female' },
    en: "I understand you're a pregnant woman with a BPL card in Rajasthan. Let me find all the maternal and family welfare schemes for you.",
    hi: "मैं समझ गया कि आप राजस्थान में BPL कार्ड व���ली गर्भवती महिला हैं। मैं आपके लिए सभी मातृत्व और परिवार कल्याण योजनाएं ढूंढता हूं।" },
  { trigger: 'default', profile: { occupation: 'Daily wage worker', state: 'Bihar', income: '₹72,000', age: '55', category: 'General', bpl: 'No', gender: 'Male' },
    en: "Thank you for sharing your details. I'm matching your profile against 500+ government schemes now...",
    hi: "आपकी जानकारी के लिए धन्यवाद। मैं अब 500+ सरकारी योजनाओं से आपका प्रोफाइल मिला रहा हूं..." },
];