export const SITE = {
  name: { ar: 'مركز الراعي للغات', en: 'Rai Language Center' },
  shortName: { ar: 'الراعي', en: 'RLC' },
  url: 'https://railanguagecenter.com',
  founded: 1995,
  founder: { ar: 'نهى راعي', en: 'Nouha Raei' },
  tagline: { ar: 'تعلّم. تواصل. انجح.', en: 'Learn. Connect. Succeed.' },
  contact: {
    phones: ['+963 17 2566699', '+963 966 466699'],
    whatsapp: '+963 966 466699',
    email: 'info@railanguagecenter.com',
    addressLines: {
      ar: ['اللاذقية — سوريا', 'شارع عمر بن الخطاب (القوتلي)'],
      en: ['Latakia — Syria', 'Omar Ibn Al-Khattab Street (Al-Quwatli)'],
    },
  },
  social: {
    facebookPage: 'https://www.facebook.com/profile.php?id=61589138416877',
    facebookGroup: 'https://www.facebook.com/groups/railc',
    instagram: 'https://www.instagram.com/rai_language_center/',
    whatsapp: 'https://www.whatsapp.com/channel/0029Vb65VsA3QxS2UiyFkO2C',
    youtube: 'https://youtube.com/@railanguagecenter',
  },
  stats: {
    studentsTaught: 12000,
    yearsActive: new Date().getFullYear() - 1995,
  },
} as const;
