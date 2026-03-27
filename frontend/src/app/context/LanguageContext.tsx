import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { languageFade } from '../utils/animations';

export type Lang = 'hi' | 'en' | 'bn' | 'kn' | 'ml' | 'mr' | 'od' | 'pa' | 'ta' | 'te' | 'gu';

export const languageInfo: Record<Lang, { name: string; nativeName: string; color: string }> = {
  hi: { name: 'Hindi', nativeName: 'हिंदी', color: '#FF9933' },
  en: { name: 'English', nativeName: 'English', color: '#000080' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', color: '#138808' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', color: '#DC143C' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', color: '#8B4513' },
  mr: { name: 'Marathi', nativeName: 'मराठी', color: '#FF6B35' },
  od: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', color: '#4B0082' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', color: '#FFD700' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', color: '#FF9933' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', color: '#FFA500' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', color: '#138808' }
};

// Core translations - expand as needed
const translations: Record<string, Partial<Record<Lang, string>>> = {
  // TopNav
  'nav.wordmark': { 
    hi: 'जन साथी', 
    en: 'Jan Saathi',
    bn: 'জন সাথী',
    kn: 'ಜನ ಸಾಥಿ',
    ml: 'ജന സാഥി',
    mr: 'जन साथी',
    od: 'ଜନ ସାଥୀ',
    pa: 'ਜਨ ਸਾਥੀ',
    ta: 'ஜன சாத்தி',
    te: 'జన సాథి',
    gu: 'જન સાથી'
  },
  'nav.subtext': { 
    hi: 'सरकारी योजनाएं, आसान भाषा में',
    en: 'Government schemes, spoken simply',
    bn: 'সরকারি প্রকল্প, সহজভাবে',
    kn: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಸರಳವಾಗಿ',
    ml: 'സർಕ്കാർ പദ്ധതികൾ, ലളിതമായി',
    mr: 'सरकारी योजना, सोप्या भाषेत',
    od: 'ସରକାରୀ ଯୋଜନା, ସରଳ ଭାଷାରେ',
    pa: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ, ਸਰਲ ਭਾਸ਼ਾ ਵਿੱਚ',
    ta: 'அரசு திட்டங்கள், எளிதாக',
    te: 'ప్రభుత్వ పథకాలు, సరళంగా',
    gu: 'સરકારી યોજનાઓ, સરળ ભાષામાં'
  },
  'nav.login': {
    hi: 'Google से लॉगिन करें',
    en: 'Log in with Google',
    bn: 'Google দিয়ে লগইন করুন',
    kn: 'Google ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
    ml: 'Google ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക',
    mr: 'Google सह लॉगिन करा',
    od: 'Google ସହିତ ଲଗଇନ୍ କରନ୍ତୁ',
    pa: 'Google ਨਾਲ ਲਾਗਿਨ ਕਰੋ',
    ta: 'Google மூலம் உள்நுழையவும்',
    te: 'Google తో లాగిన్ అవ్వండి',
    gu: 'Google સાથે લૉગિન કરો'
  },
  'nav.profile': {
    hi: 'मेरा प्रोफाइल',
    en: 'My Profile',
    bn: 'আমার প্রোফাইল',
    kn: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    ml: 'എന്റെ പ്രൊഫൈൽ',
    mr: 'माझे प्रोफाइल',
    od: 'ମୋର ପ୍ରୋଫାଇଲ୍',
    pa: 'ਮੇਰਾ ਪ੍ਰੋਫਾਈਲ',
    ta: 'எனது சுயவிவரம்',
    te: 'నా ప్రొఫైల్',
    gu: 'મારી પ્રોફાઇલ'
  },
  'nav.logout': {
    hi: 'लॉग आउट',
    en: 'Log out',
    bn: 'লগআউট',
    kn: 'ಲಾಗೌಟ್',
    ml: 'ലോഗൗട്ട്',
    mr: 'लॉग आउट',
    od: 'ଲଗଆଉଟ୍',
    pa: 'ਲਾਗਆਉਟ',
    ta: 'வெளியேறு',
    te: 'లాగౌట్',
    gu: 'લૉગઆઉટ'
  },
  'nav.admin': {
    hi: 'एडमिन',
    en: 'Admin',
    bn: 'অ্যাডমিন',
    kn: 'ಅଡ್ಮಿನ್',
    ml: 'അഡ്മിൻ',
    mr: 'प्रशासक',
    od: 'ଆଡମିନ୍',
    pa: 'ਐਡਮਿਨ',
    ta: 'நிர்வாகி',
    te: 'అడ్మిన్',
    gu: 'એડમિન'
  },
  'nav.language': {
    hi: 'भाषा चुनें',
    en: 'Choose Language',
    bn: 'ভাষা নির্বাচন করুন',
    kn: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    ml: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    mr: 'भाषा निवडा',
    od: 'ଭାଷା ବାଛନ୍ତୁ',
    pa: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    ta: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    te: 'భాషను ఎంచుకోండి',
    gu: 'ભાષા પસંદ કરો'
  },
  // Footer
  'footer.tagline': {
    hi: 'नागरिक को योजना का नाम जानने की जरूरत नहीं। जन साथी खुद ढूंढता है।',
    en: 'The citizen does not need to know a scheme exists. Jan Saathi finds it for them.',
    bn: 'নাগরিকদের প্রকল্পের নাম জানার প্রয়োজন নেই। জন সাথী খুঁজে দেয়।',
    kn: 'ನಾಗರಿಕರು ಯೋಜನೆಯ ಹೆಸರು ತಿಳಿಯಬೇಕಾಗಿಲ್ಲ। ಜನ ಸಾಥಿ ಹುಡುಕುತ್ತದೆ।',
    ml: 'പൗരന് പദ്ധതിയുടെ പേര് അറിയേണ്ടതില്ല। ജന സാഥി കണ്ടെത്തും।',
    mr: 'नागरिकांना योजनेचे नाव माहीत असणे गरजेचे नाही। जन साथी शोधतो।',
    od: 'ନାଗରିକଙ୍କୁ ଯୋଜନାର ନାମ ଜାଣିବା ଆବଶ୍ୟକ ନାହିଁ। ଜନ ସାଥୀ ଖୋଜେ।',
    pa: 'ਨਾਗਰਿਕ ਨੂੰ ਸਕੀਮ ਦਾ ਨਾਂ ਜਾਣਨ ਦੀ ਲੋੜ ਨਹੀਂ। ਜਨ ਸਾਥੀ ਲੱਭ ਲੈਂਦਾ ਹੈ।',
    ta: 'குடிமக்கள் திட்டத்தின் பெயரை அறிய வேண்டியதில்லை। ஜன சாத்தி கண்டுபிடிக்கிறது।',
    te: 'పౌరులకు పథకం పేరు తెలియాల్సిన అవసరం లేదు। జన సాథి కనుగొంటుంది।',
    gu: 'નાગરિકને યોજનાનું નામ જાણવાની જરૂર નથી। જન સાથી શોધે છે।'
  },
  'footer.credit': {
    hi: 'Build4Bharat Hackathon 9.0 में बनाया गया',
    en: 'Built at Build4Bharat Hackathon 9.0',
    bn: 'Build4Bharat Hackathon 9.0-এ তৈরি',
    kn: 'Build4Bharat Hackathon 9.0 ನಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ',
    ml: 'Build4Bharat Hackathon 9.0-ൽ നിർമ്മിച്ചത്',
    mr: 'Build4Bharat Hackathon 9.0 मध्ये तयार केले',
    od: 'Build4Bharat Hackathon 9.0 ରେ ନିର୍ମିତ',
    pa: 'Build4Bharat Hackathon 9.0 ਵਿੱਚ ਬਣਾਇਆ ਗਿਆ',
    ta: 'Build4Bharat Hackathon 9.0-ல் உருவாக்கப்பட்டது',
    te: 'Build4Bharat Hackathon 9.0లో నిర్మించబడింది',
    gu: 'Build4Bharat Hackathon 9.0 માં બનાવવામાં આવ્યું'
  },
  // Landing
  'hero.headline': {
    hi: 'आपकी सरकारी योजनाएं। 8 सेकंड में मिलती हैं।',
    en: 'Your government schemes. Found in 8 seconds.',
    bn: 'আপনার সরকারি প্রকল্প। 8 সেকেন্ডে পাওয়া যায়।',
    kn: 'ನಿಮ್ಮ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು। 8 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಸಿಗುತ್ತದೆ।',
    ml: 'നിങ്ങളുടെ സർക്കാർ പദ്ധതികൾ। 8 സെക്കൻഡിൽ കണ്ടെത്തും।',
    mr: 'तुमच्या सरकारी योजना। 8 सेकंदात मिळतात।',
    od: 'ଆପଣଙ୍କର ସରକାରୀ ଯୋଜନା। 8 ସେକେଣ୍ଡରେ ମିଳେ।',
    pa: 'ਤੁਹਾਡੀਆਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ। 8 ਸਕਿੰਟ ਵਿੱਚ ਮਿਲ ਜਾਂਦੀਆਂ ਹਨ।',
    ta: 'உங்கள் அரசு திட்டங்கள். 8 வினாடிகளில் கிடைக்கும்।',
    te: 'మీ ప్రభుత్వ పథకాలు। 8 సెకన్లలో దొరుకుతాయి।',
    gu: 'તમારી સરકારી યોજનાઓ। 8 સેકન્ડમાં મળે છે।'
  },
  'hero.subtext': {
    hi: 'हिंदी या अंग्रेज़ी में बोलें। जन साथी आपके लिए सभी योजनाएं ढूंढता है — और बताता है कि आप कितना पा सकते हैं।',
    en: 'Speak in Hindi or English. Jan Saathi matches you to every scheme you qualify for — and tells you exactly how much you can claim.',
    bn: 'বাংলায় বলুন। জন সাথী আপনার জন্য সব প্রকল্প খুঁজে দেয় — এবং বলে আপনি কত পেতে পারেন।',
    kn: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ। ಜನ ಸಾಥಿ ನಿಮಗೆ ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕುತ್ತದೆ — ಮತ್ತು ನೀವು ಎಷ್ಟು ಪಡೆಯಬಹುದು ಎಂದು ಹೇಳುತ್ತದೆ।',
    ml: 'മലയാളത്തിൽ സംസാരിക്കുക। ജന സാഥി നിങ്ങൾക്കായി എല്ലാ പദ്ധതികളും കണ്ടെത്തും — നിങ്ങൾക്ക് എത്രയ്ക്ക് അർഹതയുണ്ടെന്ന് പറയും।',
    mr: 'मराठीत बोला। जन साथी तुमच्यासाठी सर्व योजना शोधतो — आणि तुम्ही किती मिळवू शकता ते सांगतो।',
    od: 'ଓଡ଼ିଆରେ କୁହନ୍ତୁ। ଜନ ସାଥୀ ଆପଣଙ୍କ ପାଇଁ ସମସ୍ତ ଯୋଜନା ଖୋଜେ — ଏବଂ ଆପଣ କେତେ ପାଇପାରିବେ ତାହା କୁହେ।',
    pa: 'ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ। ਜਨ ਸਾਥੀ ਤੁਹਾਡੇ ਲਈ ਸਾਰੀਆਂ ਸਕੀਮਾਂ ਲੱਭਦਾ ਹੈ — ਅਤੇ ਦੱਸਦਾ ਹੈ ਕਿ ਤੁਸੀਂ ਕਿੰਨਾ ਪਾ ਸਕਦੇ ਹੋ।',
    ta: 'தமிழில் பேசுங்கள். ஜன சாத்தி உங்களுக்காக அனைத்து திட்டங்களையும் கண்டுபிடிக்கிறது — நீங்கள் எவ்வளவு பெறலாம் என்று சொல்கிறது।',
    te: 'తెలుగులో మాట్లాడండి। జన సాథి మీ కోసం అన్ని పథకాలను కనుగొంటుంది — మీరు ఎంత పొందగలరో చెబుతుంది।',
    gu: 'ગુજરાતીમાં બોલો। જન સાથી તમારા માટે બધી યોજનાઓ શોધે છે — અને તમે કેટલું મેળવી શકો છો તે કહે છે।'
  },
  'voice.tap': {
    hi: 'बोलने के लिए दबाएं',
    en: 'Tap to speak',
    bn: 'কথা বলতে ট্যাপ করুন',
    kn: 'ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    ml: 'സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക',
    mr: 'बोलण्यासाठी टॅप करा',
    od: 'କହିବା ପାଇଁ ଟ୍ୟାପ୍ କରନ୍ତୁ',
    pa: 'ਬੋਲਣ ਲਈ ਟੈਪ ਕਰੋ',
    ta: 'பேச டேப் செய்யுங்கள்',
    te: 'మాట్లాడటానికి ట్యాప్ చేయండి',
    gu: 'બોલવા માટે ટૅપ કરો'
  },
  'voice.listening': {
    hi: 'सुन रहा हूं...',
    en: 'Listening...',
    bn: 'শুনছি...',
    kn: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    ml: 'কേൾക്കുന്നു...',
    mr: 'ऐकत आहे...',
    od: 'ଶୁଣୁଛି...',
    pa: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...',
    ta: 'கேட்கிறேன்...',
    te: 'వింటున్నాను...',
    gu: 'સાંભળી રહ્યો છું...'
  },
  'voice.processing': {
    hi: 'सोच रहा हूं...',
    en: 'Thinking...',
    bn: 'ভাবছি...',
    kn: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
    ml: 'ചിന്തിക്കുന്നു...',
    mr: 'विचार करत आहे...',
    od: 'ଚିନ୍ତା କରୁଛି...',
    pa: 'ਸੋਚ ਰਿਹਾ ਹਾਂ...',
    ta: 'சிந்திக்கிறேன்...',
    te: 'ఆలోచిస్తున్నాను...',
    gu: 'વિચારી રહ્યો છું...'
  },
  'input.placeholder': {
    hi: 'या यहाँ टाइप करें — राज्य, काम, आमदनी...',
    en: 'Or type here — your state, occupation, income...',
    bn: 'অথবা এখানে টাইপ করুন — রাজ্য, পেশা, আয়...',
    kn: 'ಅಥવಾ ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ — ರಾಜ್ಯ, ಉದ್ಯೋಗ, ಆದಾಯ...',
    ml: 'അല്ലെങ്കിൽ ഇവിടെ ടൈപ്പ് ചെയ്യുക — സംസ്ഥാനം, തൊഴിൽ, വരുമാനം...',
    mr: 'किंवा येथे टाइप करा — राज्य, व्यवसाय, उत्पन्न...',
    od: 'କିମ୍ବା ଏଠାରେ ଟାଇପ୍ କରନ୍ତୁ — ରାଜ୍ୟ, ବୃତ୍ତି, ଆୟ...',
    pa: 'ਜਾਂ ਇੱਥੇ ਟਾਈਪ ਕਰੋ — ਰਾਜ, ਪੇਸ਼ਾ, ਆਮਦਨ...',
    ta: 'அல்லது இங்கே தட்டச்சு செய்யுங்கள் — மாநிலம், தொழில், வருமானம்...',
    te: 'లేదా ఇక్కడ టైప్ చెయ్యండి — రాష్ట్రం, వృత్తి, ఆదాయం...',
    gu: 'અથવા અહીં ટાઇપ કરો — રાજ્ય, વ્યવસાય, આવક...'
  },
  'input.submit': {
    hi: 'मेरी योजनाएं ढूंढें',
    en: 'Find my schemes',
    bn: 'আমার প্রকল্প খুঁজুন',
    kn: 'ನನ್ನ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ',
    ml: 'എന്റെ പദ്ധതികൾ കണ്ടെത്തുക',
    mr: 'माझ्या योजना शोधा',
    od: 'ମୋର ଯୋଜନା ଖୋଜନ୍ତୁ',
    pa: 'ਮੇਰੀਆਂ ਸਕੀਮਾਂ ਲੱਭੋ',
    ta: 'எனது திட்டங்களைக் கண்டுபிடி',
    te: 'నా పథకాలను కనుగొనండి',
    gu: 'મારી યોજનાઓ શોધો'
  },
  // Examples
  'example.1': { hi: 'मैं बिहार का किसान हूं, मेरी आमदनी ₹80,000 है', en: 'I am a farmer from Bihar, my income is ₹80,000' },
  'example.2': { hi: 'महाराष्ट्र में व्यापार करता हूं', en: 'I run a business in Maharashtra' },
  'example.3': { hi: 'कर्नाटक से छात्र हूं', en: 'I am a student from Karnataka' },
  // Chat
  'chat.first': { hi: 'नमस्ते! मैं वेद हूं, आपका जन साथी। मुझे बताएं — आप कहां रहते हैं, क्या करते हैं, और कितनी आमदनी है। मैं आपके लिए सरकारी योजनाएं ढूंढूंगा।', en: 'Hello! I am Ved, your Jan Saathi. Tell me — where you live, what you do, and your income. I will find government schemes for you.' },
  'chat.placeholder': { hi: 'अपना सवाल लिखें...', en: 'Type your question...' },
  'chat.send': { hi: 'भेजें', en: 'Send' },
  'chat.speak': { hi: 'सुनें', en: 'Listen' },
  // Profile
  'profile.state': { hi: 'राज्य', en: 'State' },
  'profile.occupation': { hi: 'पेशा', en: 'Occupation' },
  'profile.age': { hi: 'उम्र', en: 'Age' },
  'profile.income': { hi: 'आमदनी', en: 'Income' },
  'profile.category': { hi: 'श्रेणी', en: 'Category' },
  'profile.bpl': { hi: 'BPL', en: 'BPL' },
  'profile.gender': { hi: 'लिंग', en: 'Gender' },
  'profile.header': { hi: 'प्रोफाइल', en: 'Profile' },
  'profile.saved': { hi: 'प्रोफाइल सहेजा गया', en: 'Profile saved' },
  'profile.save': { hi: 'सहेजें', en: 'Save' },
  'profile.clear': { hi: 'मिटाएं', en: 'Clear' },
  'profile.schemes_header': { hi: 'सहेजी गई योजनाएं', en: 'Saved Schemes' },
  'profile.no_schemes': { hi: 'कोई योजना सहेजी नहीं गई', en: 'No schemes saved' },
  'profile.sessions_header': { hi: 'पिछले सत्र', en: 'Past Sessions' },
  'profile.no_sessions': { hi: 'कोई पिछला सत्र नहीं', en: 'No past sessions' },
  // Gap Card
  'gap.your_benefits': { hi: 'आपके कुल लाभ', en: 'Your Total Benefits' },
  'gap.across': { hi: '{scheme_count} योजनाओं में', en: 'across {scheme_count} schemes' },
  'gap.cta': { hi: 'सभी योजनाएं देखें', en: 'View All Schemes' },
  // Save prompt
  'save.prompt': { hi: 'अपनी प्रोफाइल सहेजें ताकि आपकी जानकारी याद रहे', en: 'Save your profile so we remember your details' },
  'save.google': { hi: 'Google से सहेजें', en: 'Save with Google' },
  'save.notnow': { hi: 'अभी नहीं', en: 'Not now' },
  // Schemes
  'scheme.empty': { hi: 'अभी कोई योजना नहीं मिली। पहले चैट में अपनी जानकारी दें।', en: 'No schemes found yet. Share your details in chat first.' },
  'scheme.update': { hi: 'चैट पर जाएं', en: 'Go to Chat' },
  'scheme.per_year': { hi: '₹{value}/वर्ष', en: '₹{value}/year' },
  'scheme.how_apply': { hi: 'कैसे आवेदन करें', en: 'How to Apply' },
  'scheme.ask': { hi: 'वेद से पूछें', en: 'Ask Ved' },
  'scheme.start': { hi: 'आवेदन शुरू करें', en: 'Start Application' },
  'scheme.apply_online': { hi: 'ऑनलाइन आवेदन', en: 'Apply Online' },
  'scheme.back': { hi: 'वापस जाएं', en: 'Go Back' },
  'schemes.gap_banner': { hi: 'आपको ₹{gap_value}/वर्ष मिल सकते हैं — {count} योजनाओं से!', en: 'You can get ₹{gap_value}/year — from {count} schemes!' },
  'schemes.gap_sub': { hi: '{state} • {occupation} • {age} वर्ष • ₹{income}/वर्ष', en: '{state} • {occupation} • {age} years • ₹{income}/year' },
  // Filters
  'filter.all': { hi: 'सभी', en: 'All' },
  'filter.agriculture': { hi: 'कृषि', en: 'Agriculture' },
  'filter.health': { hi: 'स्वास्थ्य', en: 'Health' },
  'filter.education': { hi: 'शिक्षा', en: 'Education' },
  'filter.employment': { hi: 'रोजगार', en: 'Employment' },
  'filter.social': { hi: 'समाज कल्याण', en: 'Social welfare' },
  // Sort
  'sort.highest': { hi: 'सबसे ज़्यादा लाभ', en: 'Highest Benefit' },
  'sort.easiest': { hi: 'सबसे आसान', en: 'Easiest' },
  'sort.best': { hi: 'सबसे अच्छा मैच', en: 'Best Match' },
  // Detail
  'detail.overview': { hi: 'अवलोकन', en: 'Overview' },
  'detail.eligibility': { hi: '��ात्रता', en: 'Eligibility' },
  'detail.documents': { hi: 'दस्तावेज़', en: 'Documents' },
  'detail.howto': { hi: 'कैसे करें', en: 'How To' },
  'detail.what': { hi: 'यह योजना क्या है?', en: 'What is this scheme?' },
  'detail.qualify': { hi: 'पात्रता मानदंड', en: 'Eligibility Criteria' },
  'detail.need': { hi: 'ज़रूरी दस्तावेज़', en: 'Required Documents' },
  'detail.steps': { hi: 'आवेदन के चरण', en: 'Application Steps' },
  'detail.note': { hi: 'सभी दस्तावेज़ के मूल और फोटोकॉपी दोनों लाएं', en: 'Bring both originals and photocopies of all documents' },
  'detail.office': { hi: 'ऑफिस: {office_type}', en: 'Office: {office_type}' },
  'detail.official': { hi: 'आधिकारिक वेबसाइट', en: 'Official Website' },
  'detail.benefit': { hi: '₹{value}/वर्ष', en: '₹{value}/year' },
  'detail.listen': { hi: 'सुनें', en: 'Listen' },
  'detail.pause': { hi: 'रोकें', en: 'Pause' },
  'detail.submit': { hi: 'आवेदन जमा करें', en: 'Submit Application' },
  'detail.submitting': { hi: 'जमा हो रहा है...', en: 'Submitting...' },
  'detail.success': { hi: 'आवेदन जमा! Ref: {ref_number}', en: 'Application submitted! Ref: {ref_number}' },
  'detail.expected': { hi: '15 कार्य दिवसों में', en: 'Expected in 15 working days' },
  'detail.track_cta': { hi: 'आवेदन ट्रैक करें', en: 'Track Application' },
  // Track
  'track.header': { hi: 'आवेदन ट्रैक करें', en: 'Track Application' },
  'track.sub': { hi: 'अपना संदर्भ नंबर डालें', en: 'Enter your reference number' },
  'track.placeholder': { hi: 'JAN-2026-XXXXX', en: 'JAN-2026-XXXXX' },
  'track.btn': { hi: 'ट्रैक करें', en: 'Track' },
  'track.notfound': { hi: 'कोई आवेदन नहीं मिला', en: 'No application found' },
  'track.s1': { hi: 'जमा किया', en: 'Submitted' },
  'track.s2': { hi: 'समीक्षा में', en: 'Under Review' },
  'track.s3': { hi: 'स्वीकृत', en: 'Approved' },
  'track.rejected': { hi: 'अस्वीकृत', en: 'Rejected' },
  'track.expected': { hi: 'अपेक्षित: {date}', en: 'Expected: {date}' },
  // How section
  'how.heading': { hi: 'यह कैसे काम करता है', en: 'How It Works' },
  'how.1.title': { hi: 'बोलें या लिखें', en: 'Speak or Type' },
  'how.1.body': { hi: 'अपनी जानकारी हिंदी या अंग्रेज़ी में बताएं', en: 'Share your details in Hindi or English' },
  'how.2.title': { hi: 'AI मैचिंग', en: 'AI Matching' },
  'how.2.body': { hi: '500+ योजनाओं से आपके लिए सही योजनाएं ढूंढी जाती हैं', en: 'We match you against 500+ schemes instantly' },
  'how.3.title': { hi: 'आवेदन करें', en: 'Apply' },
  'how.3.body': { hi: 'स्टेप-बाय-स्टेप गाइड और दस्तावेज़ सूची', en: 'Step-by-step guide with document checklist' },
  // 404
  '404.heading': { hi: 'पेज नहीं मिला', en: 'Page Not Found' },
  '404.body': { hi: 'जो आप ढूंढ रहे हैं वह यहां नहीं है', en: "What you're looking for isn't here" },
  '404.cta': { hi: 'होम जाएं', en: 'Go Home' },
  // Admin
  'admin.title': { hi: 'एडमिन पैनल', en: 'Admin Panel' },
  'admin.dashboard': { hi: 'डैशबोर्ड', en: 'Dashboard' },
  'admin.pipeline': { hi: 'पाइपलाइन', en: 'Pipeline' },
  'admin.schemes': { hi: 'योजनाएं', en: 'Schemes' },
  'admin.sessions': { hi: 'सत्र', en: 'Sessions' },
  'admin.users': { hi: 'उपयोगकर्ता', en: 'Users' },
  'admin.view_site': { hi: 'साइट देखें', en: 'View Site' },
  'admin.sessions_today': { hi: 'आज के सत्र', en: 'Sessions Today' },
  'admin.total_gap': { hi: 'कुल गैप', en: 'Total Gap' },
  'admin.schemes_db': { hi: 'DB में योजनाएं', en: 'Schemes in DB' },
  'admin.pending': { hi: 'लंबित समीक्षा', en: 'Pending Review' },
  'admin.gap_chart': { hi: 'गैप चार्ट', en: 'Gap Chart' },
  'admin.top_schemes': { hi: 'शीर्ष योजनाएं', en: 'Top Schemes' },
  'admin.recent': { hi: 'हालिया सत्र', en: 'Recent Sessions' },
  'admin.run_pipeline': { hi: 'पाइपलाइन चलाएं', en: 'Run Pipeline' },
  'admin.review_queue': { hi: 'समीक्षा कतार ({count})', en: 'Review Queue ({count})' },
  'admin.approve': { hi: 'स्वीकृत', en: 'Approve' },
  'admin.reject': { hi: 'अस्वीकृत', en: 'Reject' },
  'admin.search_schemes': { hi: 'योजना खोजें...', en: 'Search schemes...' },
  'admin.export_csv': { hi: 'CSV निर्यात', en: 'Export CSV' },
  'admin.query_patterns': { hi: 'क्वेरी पैटर्न', en: 'Query Patterns' },
  'admin.export_rag': { hi: 'RAG डेटा निर्यात', en: 'Export RAG Data' },
  'admin.admin_accounts': { hi: 'एडमिन खाते', en: 'Admin Accounts' },
  'admin.citizen_accounts': { hi: 'नागरिक खाते', en: 'Citizen Accounts' },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('hi');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setLang = useCallback((newLang: Lang) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setLangState(newLang);
      setIsTransitioning(false);
    }, 150);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const entry = translations[key];
    let text = entry?.[lang] || entry?.['hi'] || entry?.['en'] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <AnimatePresence mode="wait">
        <motion.div key={lang} initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} exit={{ opacity: 0.7 }} transition={{ duration: 0.15 }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}