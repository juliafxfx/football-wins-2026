import fs from 'node:fs/promises';

const API_BASE = 'https://api.bigballsdata.com';
const API_KEY = process.env.BIGBALLS_API_KEY;
const EXPECTED_SEASON = 2026;

if (!API_KEY) throw new Error('Missing BIGBALLS_API_KEY repository secret.');

const coaches = [
  {coach:'Clcely',nfl:'LA Rams',ncaa:'Clemson',wild:'South Carolina',wildLeague:'ncaaf'},
  {coach:'Terry',nfl:'Philadelphia',ncaa:'Oklahoma',wild:'Boise State',wildLeague:'ncaaf'},
  {coach:'SophRice',nfl:'Baltimore',ncaa:'Michigan',wild:'Washington Huskies',wildLeague:'ncaaf'},
  {coach:'Sara',nfl:'Washington',ncaa:'Virginia',wild:'NYJets',wildLeague:'nfl'},
  {coach:'Alexis',nfl:'Buffalo',ncaa:'Alabama',wild:'Navy',wildLeague:'ncaaf'},
  {coach:'Chuck',nfl:'Detroit',ncaa:'Utah',wild:'Minnesota Vikings',wildLeague:'nfl'},
  {coach:'Chrissy',nfl:'Seattle',ncaa:'West Virginia',wild:'Pitt',wildLeague:'ncaaf'},
  {coach:'Andy',nfl:'Houston',ncaa:'BYU',wild:'Kansas State',wildLeague:'ncaaf'},
  {coach:'Kelly Ellis',nfl:'Kansas City',ncaa:'Indiana',wild:'Houston Cougars',wildLeague:'ncaaf'},
  {coach:'Marian',nfl:'Denver',ncaa:'JMU',wild:'Auburn',wildLeague:'ncaaf'},
  {coach:'Ellie',nfl:'Cincinnati',ncaa:'Penn State',wild:'USC Trojans',wildLeague:'ncaaf'},
  {coach:'Kennedy',nfl:'Cleveland',ncaa:'Texas',wild:'Ole Miss',wildLeague:'ncaaf'},
  {coach:'Montse',nfl:'New England',ncaa:'Georgia',wild:'Maryland',wildLeague:'ncaaf'},
  {coach:'Julia',nfl:'Jacksonville',ncaa:'Texas Tech',wild:'Kentucky',wildLeague:'ncaaf'},
  {coach:'Kelly Hanik',nfl:'Chicago',ncaa:'SMU',wild:'Louisville',wildLeague:'ncaaf'},
  {coach:'Christy',nfl:'San Francisco',ncaa:'LSU',wild:'Washington State',wildLeague:'ncaaf'},
  {coach:'Joel',nfl:'Atlanta',ncaa:'Miami, FL',wild:'Miami, OH',wildLeague:'ncaaf'},
  {coach:'Kat',nfl:'LA Chargers',ncaa:'Oregon',wild:'Texas A&M',wildLeague:'ncaaf'},
  {coach:'Ruthie',nfl:'Pittsburgh',ncaa:'Notre Dame',wild:'Indianapolis',wildLeague:'nfl'},
  {coach:'Katy',nfl:'Green Bay',ncaa:'Ohio State',wild:'Tampa Bay',wildLeague:'nfl'},
  {coach:'Matt',nfl:'Miami',ncaa:'TCU',wild:'Arizona Wildcats',wildLeague:'ncaaf'}
];

const aliases = {
  nfl: {
    'LA Rams':'Los Angeles Rams','Philadelphia':'Philadelphia Eagles','Baltimore':'Baltimore Ravens','Washington':'Washington Commanders','NYJets':'New York Jets','Buffalo':'Buffalo Bills','Detroit':'Detroit Lions','Minnesota Vikings':'Minnesota Vikings','Seattle':'Seattle Seahawks','Houston':'Houston Texans','Kansas City':'Kansas City Chiefs','Denver':'Denver Broncos','Cincinnati':'Cincinnati Bengals','Cleveland':'Cleveland Browns','New England':'New England Patriots','Jacksonville':'Jacksonville Jaguars','Chicago':'Chicago Bears','San Francisco':'San Francisco 49ers','Atlanta':'Atlanta Falcons','LA Chargers':'Los Angeles Chargers','Pittsburgh':'Pittsburgh Steelers','Green Bay':'Green Bay Packers','Miami':'Miami Dolphins','Indianapolis':'Indianapolis Colts','Tampa Bay':'Tampa Bay Buccaneers'
  },
  ncaaf: {
    'Clemson':'Clemson Tigers','South Carolina':'South Carolina Gamecocks','Oklahoma':'Oklahoma Sooners','Boise State':'Boise State Broncos','Michigan':'Michigan Wolverines','Washington Huskies':'Washington Huskies','Virginia':'Virginia Cavaliers','Alabama':'Alabama Crimson Tide','Navy':'Navy Midshipmen','Utah':'Utah Utes','West Virginia':'West Virginia Mountaineers','Pitt':'Pittsburgh Panthers','BYU':'BYU Cougars','Kansas State':'Kansas State Wildcats','Indiana':'Indiana Hoosiers','Houston Cougars':'Houston Cougars','JMU':'James Madison Dukes','Auburn':'Auburn Tigers','Penn State':'Penn State Nittany Lions','USC Trojans':'USC Trojans','Texas':'Texas Longhorns','Ole Miss':'Ole Miss Rebels','Georgia':'Georgia Bulldogs','Maryland':'Maryland Terrapins','Texas Tech':'Texas Tech Red Raiders','Kentucky':'Kentucky Wildcats','SMU':'SMU Mustangs','Louisville':'Louisville Cardinals','LSU':'LSU Tigers','Washington State':'Washington State Cougars','Miami, FL':'Miami Hurricanes','Miami, OH':'Miami (OH) RedHawks','Oregon':'Oregon Ducks','Texas A&M':'Texas A&M Aggies','Notre Dame':'Notre Dame Fighting Irish','Ohio State':'Ohio State Buckeyes','TCU':'TCU Horned Frogs','Arizona Wildcats':'Arizona Wildcats'
  }
};

const norm = v => String(v ?? '').toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();

async function api(path) {
  const res = await fetch(`${API_BASE}${path}`, {headers:{Authorization:`Bearer ${API_KEY}`,Accept:'application/json'}});
  const text = await res.text();
  if (!res.ok) throw new Error(`Big Balls API ${res.status} on ${path}: ${text.slice(0,500)}`);
  try { return JSON.parse(text); } catch { throw new Error(`Big Balls returned non-JSON on ${path}.`); }
}

function valuesDeep(root,maxDepth=7) {
  const out=[],seen=new Set();
  const walk=(v,d)=>{
    if(d>maxDepth || v==null || typeof v!=='object' || seen.has(v)) return;
    seen.add(v); out.push(v);
    if(Array.isArray(v)) v.forEach(x=>walk(x,d+1)); else Object.values(v).forEach(x=>walk(x,d+1));
  };
  walk(root,0); return out;
}

function num(o,keys) {
  for(const k of keys) if(o && Object.prototype.hasOwnProperty.call(o,k)){const n=Number(o[k]);if(Number.isFinite(n))return n;}
  return null;
}

function teamName(o) {
  return [o?.team_name,o?.teamName,o?.name,o?.team?.name,o?.team?.team_name,o?.team?.display_name,o?.team?.displayName,o?.school,o?.program].find(v=>typeof v==='string'&&v.trim())?.trim() ?? null;
}

function extract(payload,league) {
  const seasonValues=valuesDeep(payload,4).flatMap(o=>[o?.season,o?.season_year,o?.year]).map(Number).filter(Number.isFinite);
  if(seasonValues.length && !seasonValues.includes(EXPECTED_SEASON)) throw new Error(`${league.toUpperCase()} data did not contain season ${EXPECTED_SEASON}; reported ${[...new Set(seasonValues)].join(', ')}`);

  const rows=[];
  for(const o of valuesDeep(payload)) {
    if(Array.isArray(o)) continue;
    const name=teamName(o), wins=num(o,['wins','win','w','overall_wins','overallWins']), losses=num(o,['losses','loss','l','overall_losses','overallLosses']);
    if(name && wins!==null && losses!==null && wins>=0 && wins<=30 && losses>=0 && losses<=30) rows.push({name,wins,losses});
  }
  const dedup=new Map();
  for(const r of rows){const k=norm(r.name);const old=dedup.get(k);if(!old || r.wins+r.losses>old.wins+old.losses)dedup.set(k,r);}
  const result=[...dedup.values()];
  if(league==='nfl' && result.length<28) throw new Error(`NFL parse found only ${result.length} teams; refusing to publish partial data.`);
  if(league==='ncaaf' && result.length<100) throw new Error(`NCAAF parse found only ${result.length} teams; refusing to publish partial data.`);
  return result;
}

function findTeam(rows,label,league){
  const wanted=aliases[league][label]??label, target=norm(wanted);
  const exact=rows.find(r=>norm(r.name)===target); if(exact)return exact;
  const alt=rows.filter(r=>{const n=norm(r.name);return n.includes(target)||target.includes(n);});
  if(alt.length===1)return alt[0];
  throw new Error(`Could not uniquely match ${league.toUpperCase()} team "${label}" (expected "${wanted}").`);
}

await api('/v1/user/me');
const [nflPayload,ncaaPayload]=await Promise.all([api('/v1/standings?sport=american_football&league=nfl'),api('/v1/standings?sport=american_football&league=ncaaf')]);
const nfl=extract(nflPayload,'nfl'), ncaa=extract(ncaaPayload,'ncaaf');

const record=(label,league)=>{const r=findTeam(league==='nfl'?nfl:ncaa,label,league);return {wins:r.wins,losses:r.losses,apiName:r.name};};
const leaderboard=coaches.map(c=>{const a=record(c.nfl,'nfl'),b=record(c.ncaa,'ncaaf'),d=record(c.wild,c.wildLeague);return {coach:c.coach,nfl:{team:c.nfl,...a},ncaa:{team:c.ncaa,...b},wild:{team:c.wild,league:c.wildLeague,...d},totalWins:a.wins+b.wins+d.wins};});
leaderboard.sort((a,b)=>Number(b.totalWins)-Number(a.totalWins)||String(a.coach).localeCompare(String(b.coach)));

const output={season:EXPECTED_SEASON,source:'Big Balls Sports Data standings',updatedAt:new Date().toISOString(),leaderboard,diagnostics:{nflTeamsParsed:nfl.length,ncaafTeamsParsed:ncaa.length}};
await fs.writeFile('data.json',JSON.stringify(output,null,2)+'\n','utf8');
console.log(`Published ${leaderboard.length} coaches. NFL=${nfl.length}, NCAAF=${ncaa.length}.`);
