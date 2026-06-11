const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'p20.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS ambassadors (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT NOT NULL,
    cohort    TEXT NOT NULL DEFAULT '2023',
    role      TEXT NOT NULL DEFAULT 'student',
    major     TEXT,
    bio       TEXT,
    author    TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const ambassadors2023 = [
  { name: 'Aaron Marquez-Cruz',        email: 'Aaronmarcuz75@gmail.com' },
  { name: 'Abbagail Allen',            email: 'aallen1429@k12bcs.org' },
  { name: 'Abigail Blankenship',       email: 'ablankenship5798@gmail.com' },
  { name: 'Alexander Bickford',        email: 'albickford@acsgmail.net' },
  { name: 'Alexzandyr Shepherd',       email: 'alexzandyrs@gmail.com' },
  { name: 'Aniya Griffin',             email: 'angriffin@acsgmail.com' },
  { name: 'Ari Cohen',                 email: 'arcohen@acsgmail.net' },
  { name: 'Ashleigh Grieves',          email: 'grievesashleigh@gmail.com' },
  { name: 'Aurora Perez-Martin',       email: 'aperez-martin2222@k12bcs.org' },
  { name: 'Azendae Aiken',             email: 'azendaeiken15@gmail.com' },
  { name: 'Bjorian Eaker',             email: 'bjeaker@acsgmail.net' },
  { name: 'Brennan Davidson',          email: 'bdavidson2009@stu.hcpsnc.org' },
  { name: 'Caden Trull',               email: 'trullcaden@gmail.com' },
  { name: 'Caroline Rizzo',            email: 'caroline_rizzo@mhu.edu' },
  { name: 'Cassidy Hull',              email: 'cassidy_hull@mhu.edu' },
  { name: 'Cate Boyette',              email: 'cateboyette@gmail.com' },
  { name: 'Citlally Diaz Mar',         email: 'cdiazmar9138@stu.hcpsnc.org' },
  { name: 'Clara Singleton',           email: 'clara.singleton14@gmail.com' },
  { name: 'Clennan Queen',             email: 'clennan2007queen@gmail.com' },
  { name: 'Eleura Clark',              email: 'eclark@mcsstudent.net' },
  { name: 'Ella Estrada',              email: 'elestrada@acsgmail.net' },
  { name: 'Emily Hazzard',             email: 'erhazzard8@gmail.com' },
  { name: 'Emily Rollins',             email: 'emily_rollins@mhu.edu' },
  { name: 'Emily Serrano',             email: 'emmily40ser@gmail.com' },
  { name: 'Emma Cunningham',           email: '24ecunningham@s.tcsnc.org' },
  { name: 'Emma McBeath',              email: 'emcbeath8335@stu.hcpsnc.org' },
  { name: 'Eric Velez',                email: 'ericvelez@students.abtech.edu' },
  { name: 'Fanny Reynoso-Diaz',        email: 'reynosodiaz189@gmail.com' },
  { name: 'Gabriella Bluestone',       email: 'gabriellabluestone@gmail.com' },
  { name: 'Heidi Anugrah',             email: 'heidia3479@gmail.com' },
  { name: 'Ian Abernethy',             email: 'ianabernethy17@gmail.com' },
  { name: 'Isabela Emaus',             email: '25iemaus@s.tcsnc.org' },
  { name: 'Isabella Antunes',          email: 'isabella_antunes@icloud.com' },
  { name: 'Isabella Gravley',          email: '25igravley@tcsnc.org' },
  { name: 'Jesus Lopez De Los Santos', email: '25jdelossantos30@s.tcsnc.org' },
  { name: 'Juniper Moore',             email: 'Lmoore7665@k12bcs.org' },
  { name: 'Kaitlyn Owen',              email: 'kaitlynandwincher@gmail.com' },
  { name: 'Kaylei Rathburn',           email: 'krathburn1286@stu.hcpsnc.org' },
  { name: 'Kaylie Phillips',           email: 'kphillips2373@stu.hcpsnc.org' },
  { name: 'Kimberly Jones',            email: 'kimberlymurphyjones@gmail.com' },
  { name: 'Kylie Brittain',            email: '24kbrittain@s.tcsnc.org' },
  { name: 'Londyn Suber',              email: 'Londyn071@gmail.com' },
  { name: 'Lucian Iavorschi',          email: 'liavorschi9487@k12bcs.org' },
  { name: 'Madalynne Senn',            email: 'madalynne.senn@gmail.com' },
  { name: 'Madison Corn',              email: 'mcorn2374@stu.hcpsnc.org' },
  { name: 'Marion Hawsey',             email: 'Hawseymarion@gmail.com' },
  { name: 'Mary Shelton',              email: 'mshelton1070@stu.hcpsnc.org' },
  { name: 'Melody Mitchem',            email: 'Mmitchem7171@stu.hcpsnc.org' },
  { name: 'Michael "Hilton" Swing',    email: 'mswing8406@stu.hcpsnc.org' },
  { name: 'Michele Maloney',           email: 'mmaloney0515@stu.hcpsnc.org' },
  { name: 'Natalia Lopez',             email: 'lopezosorionataliaines@gmail.com' },
  { name: 'Olivia Guernsey',           email: 'olguernsey@acsgmail.com' },
  { name: 'Owen McEntegart',           email: 'ojm415@gmail.com' },
  { name: 'Paige Marino',              email: 'paigem004@icloud.com' },
  { name: 'Rayne English',             email: 'renglish0592@stu.hcpsnc.org' },
  { name: 'Rodion Floresku',           email: 'rodionfloresku@gmail.com' },
  { name: 'Samarra Jefferson',         email: 'sajefferso@acsgmail.net' },
  { name: 'Selah Grady',               email: 'sgrady4291@stu.hcpsnc.org' },
  { name: 'Shaun Bryson',              email: 'byson0112@gmail.com' },
  { name: 'Skyler Sorrell',            email: 'sksorrell@acsgmail.net' },
  { name: 'Soren Smith',               email: 'ssmith7511@stu.hcpsnc.org' },
  { name: 'Stuart Maise',              email: 'smaise8774@k12bcs.org' },
  { name: 'Talia Farooque',            email: 'tafa1029@gmail.com' },
  { name: 'Tatum Peterkin',            email: 'tpeterkin9502@stu.hcpsnc.org' },
  { name: 'Taylor McHone',             email: 'tmchone2238@k12bcs.org' },
];

const existing = db.prepare('SELECT COUNT(*) as c FROM ambassadors WHERE cohort = ?').get('2023');
if (existing.c === 0) {
  const insert = db.prepare(
    'INSERT INTO ambassadors (name, email, cohort, role) VALUES (@name, @email, @cohort, @role)'
  );
  const insertMany = db.transaction(rows => {
    for (const row of rows) insert.run({ ...row, cohort: '2023', role: 'student' });
  });
  insertMany(ambassadors2023);
  console.log(`Seeded ${ambassadors2023.length} 2023 ambassadors.`);
} else {
  console.log('2023 ambassadors already seeded, skipping.');
}

db.close();
