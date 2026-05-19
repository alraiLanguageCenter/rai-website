// One-shot: adds the "stories" translation namespace to en.json and ar.json
// without touching other keys or breaking the existing UTF-8 encoding.
import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  {
    path: 'messages/en.json',
    block: {
      eyebrow: 'Student stories',
      title:   'Voices & wins of Rai.',
      lede:    'Thirty years of stories. These are our students — in their own words, with their results, on their journey.',
      open:    'Open the wall of voices',
    },
  },
  {
    path: 'messages/ar.json',
    block: {
      eyebrow: 'قصص الطلاب',
      title:   'أصوات وانتصارات راي.',
      lede:    'ثلاثون عاماً من القصص. هؤلاء طلابنا — بكلماتهم، بنتائجهم، في رحلتهم.',
      open:    'افتح جدار الأصوات',
    },
  },
];

for (const f of files) {
  const raw = readFileSync(f.path, 'utf8');
  const j = JSON.parse(raw);
  j.stories = f.block;
  writeFileSync(f.path, JSON.stringify(j, null, 2), 'utf8');
  console.log(`Updated ${f.path}`);
}
