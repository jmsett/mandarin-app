export const lessons = [{
  id: 'hello',
  week: 1,
  title: 'Your first hello',
  goal: 'Greet someone and introduce yourself.',
  note: '你好 is written nǐ hǎo, but in speech the first third tone changes to a rising tone: ní hǎo. Pinyin below shows dictionary tones.',
  phrases: [
    ['你好。', 'Nǐ hǎo.', 'Hello.'],
    ['我叫小明。', 'Wǒ jiào Xiǎomíng.', 'My name is Xiaoming.'],
    ['你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'What is your name?'],
    ['很高兴认识你。', 'Hěn gāoxìng rènshi nǐ.', 'Nice to meet you.']
  ],
  challenge: 'Say hello, introduce yourself using your own name, and ask the other person’s name. Try without looking.',
  question: 'How do you ask someone their name?',
  answer: '你叫什么名字？',
  dialogue: [
    ['你好！我叫小明。', 'Hello! My name is Xiaoming.'],
    ['你好，小明。我叫安娜。', 'Hello, Xiaoming. My name is Anna.'],
    ['很高兴认识你。', 'Nice to meet you.']
  ]
}, {
  id: 'repair',
  week: 1,
  title: 'Keep the conversation going',
  goal: 'Ask for repetition instead of switching to English.',
  note: '请 makes a request polite. 一 in 一遍 is normally pronounced yí before fourth-tone 遍; dictionary pinyin is yī.',
  phrases: [
    ['请再说一遍。', 'Qǐng zài shuō yī biàn.', 'Please say it again.'],
    ['请说慢一点。', 'Qǐng shuō màn yīdiǎn.', 'Please speak a little slower.'],
    ['我听不懂。', 'Wǒ tīngbudǒng.', 'I don’t understand what I’m hearing.']
  ],
  challenge: 'Imagine you missed a question. Say you did not understand, then ask for slower speech.',
  question: 'What can you say when someone speaks too fast?',
  answer: '请说慢一点。',
  dialogue: [
    ['你叫什么名字？', 'What is your name?'],
    ['请再说一遍。', 'Please say it again.'],
    ['你叫什么名字？', 'What is your name?'],
    ['我叫安娜。', 'My name is Anna.']
  ]
}, {
  id: 'courtesy',
  week: 2,
  title: 'Everyday kindness',
  goal: 'Thank someone and make a small apology.',
  note: 'The second syllables in 谢谢 and 客气 are often unstressed. 不 changes from bù to bú before a fourth tone, as in 不客气.',
  phrases: [
    ['谢谢。', 'Xièxie.', 'Thank you.'],
    ['不客气。', 'Bù kèqi.', 'You’re welcome.'],
    ['对不起。', 'Duìbuqǐ.', 'Sorry.'],
    ['没关系。', 'Méi guānxi.', 'It’s okay.']
  ],
  challenge: 'Act out receiving a drink, thanking the server, and responding when someone apologizes.',
  question: 'How do you respond to 谢谢?',
  answer: '不客气。',
  dialogue: [
    ['谢谢你！', 'Thank you!'],
    ['不客气。', 'You’re welcome.'],
    ['对不起。', 'Sorry.'],
    ['没关系。', 'It’s okay.']
  ]
}, {
  id: 'drinks',
  week: 2,
  title: 'A tea, please',
  goal: 'Order a drink politely.',
  note: '我要… means “I want…”. Add 谢谢 for a polite everyday order. 一杯 is pronounced yì bēi in connected speech.',
  phrases: [
    ['我要一杯茶。', 'Wǒ yào yī bēi chá.', 'I’d like a cup of tea.'],
    ['我要一杯水。', 'Wǒ yào yī bēi shuǐ.', 'I’d like a glass of water.'],
    ['不要糖，谢谢。', 'Bù yào táng, xièxie.', 'No sugar, thank you.']
  ],
  challenge: 'Order tea or water, ask for no sugar, and thank the server. Swap the drink and try again.',
  question: 'Order a cup of tea.',
  answer: '我要一杯茶。',
  dialogue: [
    ['你好！你要什么？', 'Hello! What would you like?'],
    ['我要一杯茶。', 'I’d like a cup of tea.'],
    ['好。', 'Okay.'],
    ['谢谢！', 'Thank you!']
  ]
}, {
  id: 'numbers',
  week: 3,
  title: 'Numbers you can use',
  goal: 'Ask a price and recognize a simple answer.',
  note: '元 is a currency unit; 块 is common in everyday speech. Learn prices by listening as well as reading.',
  phrases: [
    ['这个多少钱？', 'Zhège duōshao qián?', 'How much is this?'],
    ['十块钱。', 'Shí kuài qián.', 'Ten yuan.'],
    ['太贵了。', 'Tài guì le.', 'That’s too expensive.']
  ],
  challenge: 'Point to an object, ask the price, and answer “ten yuan”. Count aloud: 一 yī, 二 èr, 三 sān, 四 sì, 五 wǔ.',
  question: 'How do you ask “How much is this?”',
  answer: '这个多少钱？',
  dialogue: [
    ['这个多少钱？', 'How much is this?'],
    ['十块钱。', 'Ten yuan.'],
    ['好，谢谢。', 'Okay, thank you.']
  ]
}, {
  id: 'where',
  week: 3,
  title: 'Find your way',
  goal: 'Ask where something is.',
  note: '…在哪里？ means “Where is …?”. In 在这里, 这 points to “here”. Pair your first questions with a gesture.',
  phrases: [
    ['洗手间在哪里？', 'Xǐshǒujiān zài nǎlǐ?', 'Where is the restroom?'],
    ['在这里。', 'Zài zhèlǐ.', 'It’s here.'],
    ['在那里。', 'Zài nàlǐ.', 'It’s there.']
  ],
  challenge: 'Ask where the restroom is. Answer once with “here” and once with “there”, pointing as you speak.',
  question: 'Ask where the restroom is.',
  answer: '洗手间在哪里？',
  dialogue: [
    ['你好，洗手间在哪里？', 'Hello, where is the restroom?'],
    ['在那里。', 'It’s there.'],
    ['谢谢！', 'Thank you!']
  ]
}, {
  id: 'about',
  week: 4,
  title: 'A little about you',
  goal: 'Say where you are from and what you are learning.',
  note: 'Replace 德国 with your own country. 我在学… describes something you are currently learning.',
  phrases: [
    ['我是德国人。', 'Wǒ shì Déguó rén.', 'I’m German.'],
    ['我在学中文。', 'Wǒ zài xué Zhōngwén.', 'I’m learning Chinese.'],
    ['你呢？', 'Nǐ ne?', 'How about you?']
  ],
  challenge: 'Introduce yourself, say where you are from, and explain that you are learning Chinese. Ask “How about you?”',
  question: 'Say “I’m learning Chinese.”',
  answer: '我在学中文。',
  dialogue: [
    ['你好！我叫安娜。', 'Hello! My name is Anna.'],
    ['你好！你是哪国人？', 'Hello! What country are you from?'],
    ['我是德国人。你呢？', 'I’m German. How about you?']
  ]
}, {
  id: 'connect',
  week: 4,
  title: 'Your first small conversation',
  goal: 'Put your phrases together without a script.',
  note: 'Fluent use of a few phrases is useful progress. Keep listening, and ask a patient speaker for specific pronunciation feedback.',
  phrases: [
    ['你喜欢喝茶吗？', 'Nǐ xǐhuan hē chá ma?', 'Do you like drinking tea?'],
    ['我喜欢喝茶。', 'Wǒ xǐhuan hē chá.', 'I like drinking tea.'],
    ['再见！', 'Zàijiàn!', 'Goodbye!']
  ],
  challenge: 'Have a one-minute conversation: greet, introduce yourself, ask a question, request repetition, and say goodbye. A teacher or partner can give feedback.',
  question: 'Ask someone if they like drinking tea.',
  answer: '你喜欢喝茶吗？',
  dialogue: [
    ['你好！你喜欢喝茶吗？', 'Hello! Do you like drinking tea?'],
    ['我喜欢喝茶。你呢？', 'I like drinking tea. How about you?'],
    ['我也喜欢喝茶。', 'I like drinking tea too.'],
    ['再见！', 'Goodbye!']
  ]
}];
export const starterCards = lessons[0].phrases.map((p, i) => ({
  id: `hello-${i}`,
  hanzi: p[0],
  pinyin: p[1],
  english: p[2],
  source: 'hello'
}));
export const tones = [{
  text: '妈',
  pinyin: 'mā',
  label: '1 · high and level',
  path: 'M10 16 L90 16'
}, {
  text: '麻',
  pinyin: 'má',
  label: '2 · rising',
  path: 'M10 58 L90 12'
}, {
  text: '马',
  pinyin: 'mǎ',
  label: '3 · low / dipping',
  path: 'M10 38 Q42 83 58 64 L90 24'
}, {
  text: '骂',
  pinyin: 'mà',
  label: '4 · falling',
  path: 'M10 12 L90 68'
}];
export const extraResources = [{
  title: 'Pleco',
  url: 'https://www.pleco.com/',
  category: 'Tools',
  level: 'Start here',
  cost: 'Free + paid add-ons',
  note: 'Keep one dictionary close by. Check meanings and pronunciation; OCR and flashcard features depend on the edition.',
  origin: 'Additional recommendation'
}, {
  title: 'HelloChinese',
  url: 'https://www.hellochinese.cc/',
  category: 'Courses',
  level: 'Start here',
  cost: 'Free + subscription',
  note: 'An alternative core course if you prefer short, guided app lessons. Pick this or a video course as your main sequence.',
  origin: 'Additional recommendation'
}, {
  title: 'Beginner listening guide',
  url: 'https://www.hackingchinese.com/beginner-chinese-listening-practice-what-to-listen-to-and-how/',
  category: 'Listening',
  level: 'Start here',
  cost: 'Free guide',
  note: 'Find listening with pictures and clear context. Begin with clips you can mostly understand.',
  origin: 'Additional recommendation'
}, {
  title: 'Anki',
  url: 'https://apps.ankiweb.net/',
  category: 'Tools',
  level: 'Start here',
  cost: 'Varies by platform',
  note: 'Use this for a larger review collection. Our phrase deck exports as TSV; import it into your chosen Anki note type.',
  origin: 'Additional recommendation'
}];
