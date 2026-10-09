(() => {
'use strict';
const root=document.getElementById('game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbfd6e5);
scene.fog=new THREE.Fog(0xbfd6e5,38,110);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,180);
camera.position.set(13,15,18);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x71808b,2.1));
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-15,30,12);scene.add(sun);
const world=new THREE.Group();scene.add(world);
const mats={road:new THREE.MeshLambertMaterial({color:0x4f5c64}),grass:new THREE.MeshLambertMaterial({color:0x93b47c}),white:new THREE.MeshLambertMaterial({color:0xf3f5f7}),wall:new THREE.MeshLambertMaterial({color:0xd6d0c5}),dark:new THREE.MeshLambertMaterial({color:0x17202a}),roof:new THREE.MeshLambertMaterial({color:0x8f5142}),green:new THREE.MeshLambertMaterial({color:0x2f8c63}),blue:new THREE.MeshLambertMaterial({color:0x477fb1}),yellow:new THREE.MeshLambertMaterial({color:0xe7b83b}),red:new THREE.MeshLambertMaterial({color:0xb8473f})};
function box(name,x,y,z,w,h,d,mat,group=world){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.name=name;m.position.set(x,y+h/2,z);group.add(m);return m}
function cyl(name,x,y,z,r,h,mat,group=world){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat);m.name=name;m.position.set(x,y+h/2,z);group.add(m);return m}
function textSprite(txt,color='#ffffff'){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='700 28px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(8,16,26,.72)';x.beginPath();x.roundRect(4,6,248,52,16);x.fill();x.fillStyle=color;x.fillText(txt,128,33);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));s.scale.set(3.2,.8,1);return s}
box('ground',0,-.2,0,72,.2,72,mats.grass);box('main road',0,0,0,72,.05,8,mats.road);box('cross road',0,.01,0,8,.05,72,mats.road);
for(let x=-32;x<=32;x+=4)box('lane',x,.07,0,1.2,.015,.18,mats.yellow);
for(let z=-32;z<=32;z+=4)box('lane',0,.08,z,.18,.015,1.2,mats.yellow);
function building(x,z,w,d,h,color,label){const g=new THREE.Group();world.add(g);box(label+' building',x,0,z,w,h,d,new THREE.MeshLambertMaterial({color}),g);box(label+' roof',x,h,z,w+.18,.22,d+.18,mats.roof,g);const sign=textSprite(label,'#ffffff');sign.position.set(x,h+1,z-d/2-.05);g.add(sign);for(let xx=x-w/2+1;xx<x+w/2-.5;xx+=1.5)for(let yy=1.2;yy<h-.5;yy+=1.5)box('window',xx,yy,z-d/2-.03,.65,.55,.05,mats.blue,g);return g}
building(-15,-14,8,7,4.5,0xd7a26d,'BODIJA MARKET');building(15,-14,8,7,5.5,0xb6c5d3,'UCH');building(-15,14,8,7,4.2,0xd9c57c,'UNIVERSITY');building(15,14,8,7,5.2,0xc8c8ce,'DUGBE MALL');building(-27,0,7,6,3.6,0xb57c55,'HOME');building(27,0,7,6,4.4,0x9bafbd,'OFFICE');
for(let i=0;i<24;i++){const x=(i%6)*9-22,z=Math.floor(i/6)*9-22;if(Math.abs(x)<6||Math.abs(z)<6)continue;cyl('tree trunk',x,0,z,.28,1.5,mats.roof);cyl('tree crown',x,1.3,z,1.05,1.7,mats.green)}
for(let i=-30;i<=30;i+=6){box('curb',i,.12,4.35,4,.18,.35,mats.white);box('curb',i,.12,-4.35,4,.18,.35,mats.white);box('curb',4.35,.12,i,.35,.18,4,mats.white);box('curb',-4.35,.12,i,.35,.18,4,mats.white)}
const player=new THREE.Group();player.position.set(0,0,0);world.add(player); const starterObjects=new THREE.Group();world.add(starterObjects);
const skin=new THREE.MeshLambertMaterial({color:0x7b4a2e}),shirt=new THREE.MeshLambertMaterial({color:0x111820}),pants=new THREE.MeshLambertMaterial({color:0x20262d}),shoe=new THREE.MeshLambertMaterial({color:0x090b0e});
function limb(x,y,z,w,h,d,mat){return box('player limb',x,y,z,w,h,d,mat,player)}
limb(-.38,0,-.02,.45,1.5,.45,pants);limb(.38,0,-.02,.45,1.5,.45,pants);limb(-.38,0,-.02,.5,.28,.58,shoe);limb(.38,0,-.02,.5,.28,.58,shoe);limb(0,1.35,0,1.05,1.35,.55,shirt);cyl('player head',0,2.65,0,.48,.65,skin,player);cyl('hair',0,3.15,0,.5,.18,shoe,player);limb(-.72,1.35,0,.25,1.1,.25,shirt);limb(.72,1.35,0,.25,1.1,.25,shirt);const tag=textSprite('@Player','#9ff3ff');tag.position.set(0,4,0);player.add(tag);
function makeStarterVisual(start){starterObjects.clear();starterCar=null;const [sx,sz]=start.spawn;const home=box('starter home',sx,0,sz,5.5,2.4,4.5,new THREE.MeshLambertMaterial({color:start.color}),starterObjects);const sign=textSprite(start.home,'#fff');sign.position.set(sx,3.7,sz-2.3);starterObjects.add(sign);if(start.car!=='No car'){starterCar=new THREE.Group();starterCar.name='player vehicle';starterCar.position.set(sx+4,0,sz);starterObjects.add(starterCar);box('car body',0,.2,0,2.7,.7,1.45,mats.dark,starterCar);box('car cabin',0,.88,-.08,1.35,.55,1.1,mats.blue,starterCar);for(const x of [-.95,.95])for(const z of [-.52,.52])cyl('car wheel',x,.05,z,.32,.18,shoe,starterCar).rotation.z=Math.PI/2;const cs=textSprite(start.car,'#9ff3ff');cs.position.set(0,1.75,0);starterCar.add(cs);starterCar.visible=true}driving=false;player.visible=true}
const npcs=[];const npcColors=[0x2e6fb0,0xd68b3e,0x7e4e9a,0x2e946e,0xb53f49];
function npc(x,z,name,i){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const body=new THREE.Mesh(new THREE.BoxGeometry(.8,1.25,.48),new THREE.MeshLambertMaterial({color:npcColors[i%npcColors.length]}));body.position.y=1;g.add(body);const head=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.45,10),skin);head.position.y=1.85;g.add(head);const s=textSprite(name,'#fff');s.position.y=2.65;g.add(s);npcs.push({g,baseX:x,baseZ:z,t:Math.random()*10,phase:Math.random()*6.28})}
npc(-6,10,'@Ife',0);npc(7,10,'@Tobi',1);npc(-10,-8,'@Zainab',2);npc(10,-8,'@Daniel',3);npc(18,5,'@Chris',4);
const missionMarker=new THREE.Group();world.add(missionMarker);missionMarker.visible=false;const markerRing=new THREE.Mesh(new THREE.RingGeometry(.85,1.15,24),new THREE.MeshBasicMaterial({color:0x20d28a,side:THREE.DoubleSide}));markerRing.rotation.x=-Math.PI/2;markerRing.position.y=.16;missionMarker.add(markerRing);const markerLabel=textSprite('OBJECTIVE','#9ff3c8');markerLabel.position.y=2.5;missionMarker.add(markerLabel);
const STARTS={
 lapo:{label:'Lapo',money:5000,debt:80000,allowance:0,home:'Shared room',car:'No car',support:'Low',job:'Street Hustle / Job Hunt',circumstance:'Debt pressure: rent and repayments come first.',spawn:[-27,3],color:0xb8473f},
 average:{label:'Average',money:25000,debt:0,allowance:5000,home:'Modest apartment',car:'Used sedan',support:'₦5,000',job:'Student',circumstance:'Balanced start with normal family support.',spawn:[-2,2],color:0x477fb1},
 comfortable:{label:'Comfortable',money:120000,debt:0,allowance:15000,home:'Furnished apartment',car:'Sedan',support:'₦15,000',job:'Student / Part-time',circumstance:'Stable home life gives you room to build.',spawn:[-20,18],color:0x2e946e},
 nepo:{label:'Nepo Baby',money:500000,debt:0,allowance:50000,home:'Luxury apartment',car:'SUV',support:'₦50,000',job:'Family Business Trainee',circumstance:'Connections unlock opportunities, but reputation matters.',spawn:[20,17],color:0x7e4e9a},
 wealthy:{label:'Wealthy',money:2000000,debt:0,allowance:100000,home:'Luxury home',car:'Premium SUV',support:'₦100,000',job:'Investor / Business Owner',circumstance:'Large resources and property access create a major head start.',spawn:[26,-2],color:0xe7b83b}
};
const JOBS=[
 {id:'gig',name:'Delivery Rider',pay:3500,energy:10,req:0,desc:'Short delivery shifts around Ibadan.'},
 {id:'retail',name:'Shop Assistant',pay:5000,energy:14,req:1,desc:'Work a market or mall retail shift.'},
 {id:'office',name:'Office Assistant',pay:8500,energy:16,req:2,desc:'Entry-level office work.'},
 {id:'developer',name:'Junior Developer',pay:15000,energy:18,req:3,desc:'Tech work unlocked by higher reputation.'},
 {id:'family',name:'Family Business',pay:22000,energy:14,req:2,desc:'Available early to connected starts.'}
];
let bankDebt=0,bankSavings=0,currentJob=null,lastPayDay=-1;let activeMission=null,missionCompletions=0;let starterCar=null,driving=false;
let activeStart=null,money=25000,progress=35,rep=2,hunger=78,energy=72,fun=64,social=58,hygiene=84,health=92,bladder=76,gameMinutes=8*60;const keys={w:false,a:false,s:false,d:false};let camAngle=.62,camDistance=23,dragging=false,lastX=0;
const $=id=>document.getElementById(id);function moneyText(n){return '₦'+Math.max(0,Math.round(n)).toLocaleString('en-NG')}
function applyStart(key){const s=STARTS[key];if(!s)return;activeStart=key;money=s.money;bankDebt=s.debt;bankSavings=0;currentJob=null;progress=key==='lapo'?10:key==='wealthy'?70:key==='nepo'?55:key==='comfortable'?45:35;rep=key==='lapo'?1:key==='wealthy'?4:key==='nepo'?3:2;player.position.set(s.spawn[0],0,s.spawn[1]);makeStarterVisual(s);$('jobTitle').textContent=s.job;$('place').textContent=s.home+' · Ibadan';$('task').textContent=s.circumstance;localStorage.setItem('ibadanLifeStart',key);renderUI();$('startScreen').classList.remove('show');$('startScreen').style.display='none';saveGame();toast('🌆 '+s.label+' life started');}
function saveGame(){if(!activeStart||!STARTS[activeStart])return;try{localStorage.setItem('ibadanLifeSave',JSON.stringify({activeStart,money,bankDebt,bankSavings,progress,rep,hunger,energy,fun,social,hygiene,health,bladder,gameMinutes,position:[player.position.x,player.position.y,player.position.z],activeMission,missionCompletions,driving}))}catch(e){}}
function restoreGame(data){const start=data&&STARTS[data.activeStart];if(!start)return false;activeStart=data.activeStart;if(Number.isFinite(data.money))money=data.money;if(Number.isFinite(data.bankDebt))bankDebt=data.bankDebt;if(Number.isFinite(data.bankSavings))bankSavings=data.bankSavings;if(Number.isFinite(data.progress))progress=data.progress;if(Number.isFinite(data.rep))rep=data.rep;if(Number.isFinite(data.hunger))hunger=data.hunger;if(Number.isFinite(data.energy))energy=data.energy;if(Number.isFinite(data.fun))fun=data.fun;if(Number.isFinite(data.social))social=data.social;if(Number.isFinite(data.hygiene))hygiene=data.hygiene;if(Number.isFinite(data.health))health=data.health;if(Number.isFinite(data.bladder))bladder=data.bladder;if(Number.isFinite(data.gameMinutes))gameMinutes=data.gameMinutes;if(typeof data.activeMission==='string')activeMission=data.activeMission;if(Number.isFinite(data.missionCompletions))missionCompletions=data.missionCompletions;if(typeof data.driving==='boolean')driving=data.driving;if(Array.isArray(data.position)&&data.position.length===3&&data.position.every(Number.isFinite))player.position.set(data.position[0],data.position[1],data.position[2]);makeStarterVisual(start);if(driving&&starterCar){starterCar.position.set(player.position.x,0,player.position.z);player.visible=false}else{driving=false;player.visible=true}updateMissionMarker();$('jobTitle').textContent=start.job;$('place').textContent=start.home+' · Ibadan';$('task').textContent=start.circumstance;$('startScreen').classList.remove('show');$('startScreen').style.display='none';renderUI();return true}
function showStart(){try{const raw=localStorage.getItem('ibadanLifeSave');if(raw&&restoreGame(JSON.parse(raw)))return}catch(e){}const saved=localStorage.getItem('ibadanLifeStart');if(saved&&STARTS[saved]){applyStart(saved);return}document.getElementById('startScreen').classList.add('show')}
function selectStart(key){document.querySelectorAll('.startOption').forEach(b=>b.classList.toggle('selected',b.dataset.start===key));const s=STARTS[key];if(!s)return;selectedStart=key;$('startSummary').textContent=s.label+' · '+s.circumstance+' Home: '+s.home+' · Vehicle: '+s.car; $('startGame').disabled=false}
let selectedStart=null;
document.querySelectorAll('.startOption').forEach(b=>b.addEventListener('click',()=>selectStart(b.dataset.start)));
$('startGame').addEventListener('click',()=>{if(selectedStart)applyStart(selectedStart)});
$('resetStart').addEventListener('click',()=>{localStorage.removeItem('ibadanLifeStart');localStorage.removeItem('ibadanLifeSave');location.reload()});

function toggleDrive(){if(driving){driving=false;player.visible=true;player.position.set(starterCar.position.x+1.6,0,starterCar.position.z+1.3);toast('🚗 You got out of your vehicle');saveGame();return}if(!starterCar){toast('🚕 No personal vehicle in this starting life. Use the Ride app.');return}const distance=Math.hypot(player.position.x-starterCar.position.x,player.position.z-starterCar.position.z);if(distance>5){toast('🚶 Walk close to your vehicle first');return}driving=true;player.position.set(starterCar.position.x,0,starterCar.position.z);player.visible=false;toast('🚗 Driving: use the movement controls');saveGame()}
function renderUI(){$('money').textContent=moneyText(money);$('progressText').textContent=Math.round(progress)+'%';$('progressBar').style.width=Math.max(0,Math.min(100,progress))+'%';$('rep').textContent=Math.floor(rep)+' / 5';$('clock').textContent=((Math.floor(gameMinutes/60)%24)||12)+':'+String(Math.floor(gameMinutes%60)).padStart(2,'0')+' '+(gameMinutes%1440<720?'AM':'PM');let mood=energy<25?'😴':hunger<25?'😵':social<25?'😔':health<35?'🤒':progress>80?'🔥':'😊';$('mood').textContent=mood;const arr=[['🍛',hunger],['⚡',energy],['🎉',fun],['💬',social],['🧼',hygiene],['🚻',bladder],['❤️',health]];$('needs').innerHTML=arr.map(([a,v])=>`<span class="need">${a} ${Math.round(v)}%</span>`).join('')}
function toast(t){const el=$('toast');el.textContent=t;el.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.opacity=0,1500)}
function action(a){if(a==='drive'){toggleDrive()}if(a==='eat'){hunger=Math.min(100,hunger+25);money=Math.max(0,money-500);$('task').textContent='Enjoy lunch';toast('🍛 You ate a local meal · −₦500')}if(a==='rest'){energy=Math.min(100,energy+28);toast('😴 You rested')}if(a==='toilet'){bladder=100;hygiene=Math.max(0,hygiene-1);toast('🚻 You used the bathroom')}if(a==='social'){social=Math.min(100,social+20);fun=Math.min(100,fun+10);toast('💬 You made time for people')}if(a==='study'){progress=Math.min(100,progress+8);energy=Math.max(0,energy-7);toast('📚 Study session complete')}if(a==='work'){progress=Math.min(100,progress+15);money+=2500;energy=Math.max(0,energy-12);hunger=Math.max(0,hunger-8);rep=Math.min(5,rep+(progress>70?.05:0));toast('💼 Shift complete · +₦2,500');$('task').textContent=progress>85?'Go home':'Next: assignment'}renderUI()}
const phone=$('phoneOverlay'), appPanel=$('appPanel');
const appCopy={
 jobs:['Jobs','Browse careers, gigs and applications. Build skills to unlock better-paying work.',['Find work','View skills']],
 messages:['Messages','Talk to friends, employers, customers and NPCs.',['Open messages']],
 bank:['Bank','Balance: '+moneyText(money)+' · Debt: '+moneyText(bankDebt)+' · Savings: '+moneyText(bankSavings),['View balance','Deposit ₦5,000','Repay ₦5,000']],
 ride:['Ride','Choose walking, bus, keke, okada, cab or your own vehicle. Cost and travel time change by route.',['Find a ride']],
 shop:['Boutique','Buy clothes, accessories and useful items for your character.',['Open shop']],
 food:['Food','Order local meals and groceries to manage hunger.',['Order food']],
 business:['Business','Own and manage shops, restaurants, services and other businesses.',['Manage business','Create business']],
 advertise:['Advertise','Promote your in-game business with billboards, radio, transport placements and featured listings.',['Create campaign','Billboards']],
 invest:['Invest','Put game money into fictional businesses, property and other in-game opportunities.',['View opportunities']],
 map:['Map','Explore Ibadan districts and discover places, jobs, businesses and activities.',['Open map']],
 travel:['Travel','Plan trips from Ibadan to other cities and, later, other Nigerian states. Travel costs money and time.',['Plan trip']],
 events:['Events','Find concerts, football, cinema, community and other activities around the city.',['View events']],
 missions:['Missions','Take on local errands, student tasks and business contracts. Travel to the marked destination to collect your reward.',['View available missions']]
};
const CATALOGUE=[
 {id:'partition',name:'Partition Wall',icon:'🧱',cat:'storage',price:18000},
 {id:'slat',name:'Wooden Slat Divider',icon:'🪵',cat:'design',price:12000},
 {id:'plant',name:'Potted Plant',icon:'🪴',cat:'decor',price:4500},
 {id:'sofa',name:'Italian Leather Sofa',icon:'🛋️',cat:'comfort',price:95000},
 {id:'bath',name:'Bathtub',icon:'🛁',cat:'bath',price:65000},
 {id:'dining',name:'Dining Table',icon:'🍽️',cat:'comfort',price:42000},
 {id:'cooker',name:'Gas Cooker',icon:'🍳',cat:'kitchen',price:28000},
 {id:'fridge',name:'Double-Door Fridge',icon:'🧊',cat:'kitchen',price:110000},
 {id:'sink',name:'Kitchen Sink',icon:'🚰',cat:'kitchen',price:18000},
 {id:'snooker',name:'Snooker Table',icon:'🎱',cat:'fun',price:140000},
 {id:'tv',name:'65\" Smart TV',icon:'📺',cat:'fun',price:135000},
 {id:'fan',name:'Standing Fan',icon:'🌬️',cat:'light',price:22000},
 {id:'ac',name:'Split Air Conditioner',icon:'❄️',cat:'comfort',price:180000},
 {id:'bucket',name:'Bucket & Bowl',icon:'🪣',cat:'bath',price:3500},
 {id:'toilet',name:'WC Toilet',icon:'🚽',cat:'bath',price:32000},
 {id:'counter',name:'Kitchen Counter',icon:'🗄️',cat:'kitchen',price:48000},
 {id:'solar',name:'Solar + Inverter',icon:'☀️',cat:'light',price:260000},
 {id:'lamp',name:'Rechargeable Lamp',icon:'🏮',cat:'light',price:9000},
 {id:'ps5',name:'PS5 Gaming Setup',icon:'🎮',cat:'fun',price:320000},
 {id:'jacuzzi',name:'Jacuzzi',icon:'🫧',cat:'luxury',price:380000},
 {id:'shower',name:'Rain Shower',icon:'🚿',cat:'bath',price:72000},
 {id:'washer',name:'Washing Machine',icon:'🧺',cat:'kitchen',price:125000},
 {id:'glass',name:'Frosted Glass Partition',icon:'🪟',cat:'design',price:38000},
 {id:'royal',name:'Royal Gold Sofa',icon:'👑',cat:'luxury',price:220000},
 {id:'speakers',name:'Party Speakers',icon:'🔊',cat:'fun',price:85000},
 {id:'aquarium',name:'Aquarium',icon:'🐠',cat:'pets',price:95000},
 {id:'lion',name:'Gold Lion Statue',icon:'🦁',cat:'luxury',price:175000}
];
const catalogueCats=[['all','📦 Storage'],['design','🎨 Design'],['sleep','🛏️ Sleep'],['kitchen','🍳 Kitchen'],['bath','🚿 Bath'],['comfort','🛋️ Comfort'],['fun','📺 Fun'],['skills','🎸 Skills'],['light','💡 Light'],['decor','🪴 Decor'],['pets','🐶 Pets'],['luxury','💎 Luxury']];
let catalogueFilter='all';
let inventory=JSON.parse(localStorage.getItem('ibadanLifeInventory')||'[]');
const placedObjects=new THREE.Group();world.add(placedObjects);
function saveInventory(){localStorage.setItem('ibadanLifeInventory',JSON.stringify(inventory))}
function furnitureVisual(item,index){
 const x=((index%4)-1.5)*2.2, z=-2+Math.floor(index/4)*2.1;
 const mat=new THREE.MeshLambertMaterial({color:item.cat==='luxury'?0xd4af37:item.cat==='decor'?0x4e9b68:item.cat==='kitchen'?0xd9d9d9:0x6b5143});
 const o=box(item.name,x,.05,z,1.7,.8,1.0,mat,placedObjects);o.userData.itemId=item.id;
 const label=textSprite(item.name,'#fff');label.position.set(x,1.2,z);placedObjects.add(label);
}
function renderCatalogue(){
 const grid=$('catalogueGrid'), owned=new Set(inventory);
 const list=catalogueFilter==='all'?CATALOGUE:CATALOGUE.filter(x=>x.cat===catalogueFilter);
 $('catalogueCats').innerHTML=catalogueCats.map(([id,label])=>'<button class="'+(id===catalogueFilter?'active':'')+'" data-cat="'+id+'">'+label+'</button>').join('');
 $('catalogueCats').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{catalogueFilter=b.dataset.cat;renderCatalogue()});
 grid.innerHTML=list.map(item=>{const have=owned.has(item.id);return '<article class="catalogueItem"><div class="itemIcon">'+item.icon+'</div><div class="itemName">'+item.name+'</div><div class="itemPrice">'+(have?'Owned':moneyText(item.price))+'</div><button data-buy="'+item.id+'">'+(have?'Place':'Buy · '+moneyText(item.price))+'</button></article>'}).join('');
 grid.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyOrPlace(b.dataset.buy));
 $('catalogueMoney').textContent=moneyText(money);
}
function buyOrPlace(id){
 const item=CATALOGUE.find(x=>x.id===id);if(!item)return;
 const i=inventory.indexOf(id);
 if(i>=0){furnitureVisual(item,i);inventory.splice(i,1);saveInventory();renderCatalogue();toast('🛋️ '+item.name+' placed');return}
 if(money<item.price){toast('💸 Not enough money for '+item.name);return}
 money-=item.price;inventory.push(id);saveInventory();renderCatalogue();renderUI();toast('📦 '+item.name+' added to storage');
}
function openBuyMode(){catalogueFilter='all';renderCatalogue();$('buyOverlay').classList.add('show');$('buyOverlay').setAttribute('aria-hidden','false')}
function closeBuyMode(){$('buyOverlay').classList.remove('show');$('buyOverlay').setAttribute('aria-hidden','true')}
function openApp(name){
 const d=appCopy[name]; if(!d)return;
 appPanel.innerHTML='<h3>'+d[0]+'</h3><p>'+d[1]+'</p><div class="appAction">'+d[2].map((x,i)=>'<button class="'+(i?'alt':'')+'" data-app-action="'+name+'">'+x+'</button>').join('')+'</div>';
 appPanel.querySelectorAll('[data-app-action]').forEach(b=>b.addEventListener('click',()=>handleAppAction(name,b.textContent)));
}
function lifeModal(title,desc,choices){$('lifeTitle').textContent=title;$('lifeDesc').textContent=desc;$('lifeChoices').innerHTML=choices.map((c,i)=>'<button class="choice" data-choice="'+i+'"><strong>'+c.title+'</strong><small>'+c.desc+'</small></button>').join('');$('lifeModal').classList.add('show');$('lifeModal').setAttribute('aria-hidden','false');$('lifeChoices').querySelectorAll('.choice').forEach((b,i)=>b.addEventListener('click',()=>{const choice=choices[i];choice.run();closeLife()}))}
function closeLife(){$('lifeModal').classList.remove('show');$('lifeModal').setAttribute('aria-hidden','true')}
$('closeLife').addEventListener('click',closeLife);
function handleAppAction(name,label){
 if(name==='jobs'){lifeModal('💼 Jobs','Choose work you can currently qualify for.',JOBS.map(j=>({title:j.name+' · '+moneyText(j.pay),desc:j.desc+' Reputation required: '+j.req,run:()=>{if(rep<j.req){toast('🔒 Build reputation to unlock this job');return}currentJob=j;money+=j.pay;energy=Math.max(0,energy-j.energy);progress=Math.min(100,progress+6);rep=Math.min(5,rep+.08);toast('💼 '+j.name+' complete · +'+moneyText(j.pay));renderUI()}})))}
 else if(name==='bank'){if(label.includes('Deposit')){const n=Math.min(5000,money);money-=n;bankSavings+=n;toast('🏦 Saved '+moneyText(n))}else if(label.includes('Repay')){const n=Math.min(5000,bankDebt,money);money-=n;bankDebt-=n;toast(n?'🏦 Debt repayment · '+moneyText(n):'🏦 Nothing to repay')}else{toast('🏦 Balance '+moneyText(money)+' · Debt '+moneyText(bankDebt)+' · Savings '+moneyText(bankSavings))}renderUI()}
 else if(name==='shop'){openBuyMode()}else if(name==='ride'){lifeModal('🚕 Choose your ride','Fares are paid from your in-game balance.',[{title:'Walk · Free',desc:'Travel to a nearby district',run:()=>moveToDistrict(0,0,'Nearby street',0)},{title:'Danfo bus · ₦300',desc:'Affordable public transport',run:()=>moveToDistrict(-15,-14,'Bodija Market',300)},{title:'Keke · ₦700',desc:'Quick neighbourhood trip',run:()=>moveToDistrict(15,-14,'UCH district',700)},{title:'Okada · ₦1,000',desc:'Fast trip across town',run:()=>moveToDistrict(-15,14,'University area',1000)},{title:'Cab · ₦2,500',desc:'Comfortable direct ride',run:()=>moveToDistrict(15,14,'Dugbe Mall',2500)}])}
 else if(name==='travel'){lifeModal('🚌 Interstate travel','Choose a Nigerian destination. This prototype simulates the journey and fare; full separate city maps are a later update.',[{title:'Abeokuta · ₦4,000',desc:'Ogun State · short trip',run:()=>simulateTrip('Abeokuta',4000,60)},{title:'Osogbo · ₦3,500',desc:'Osun State',run:()=>simulateTrip('Osogbo',3500,55)},{title:'Lagos · ₦12,000',desc:'Lagos State · longer trip',run:()=>simulateTrip('Lagos',12000,180)},{title:'Ilorin · ₦6,000',desc:'Kwara State',run:()=>simulateTrip('Ilorin',6000,120)}])}
 else if(name==='business'){lifeModal('🏢 Start a business','Buy an in-game business, then return later to collect simulated earnings.',[{title:'Mini-mart · ₦100,000',desc:'Collect ₦5,000 per visit',run:()=>buyBusiness('Mini-mart',100000,5000)},{title:'Barbing salon · ₦80,000',desc:'Collect ₦4,000 per visit',run:()=>buyBusiness('Barbing salon',80000,4000)},{title:'Food spot · ₦250,000',desc:'Collect ₦14,000 per visit',run:()=>buyBusiness('Food spot',250000,14000)},{title:'Collect earnings',desc:'Collect from businesses you already own',run:()=>collectBusinessIncome()}])}
 else if(name==='advertise'){lifeModal('📢 Business advertising','Promote your in-game business for a reputation and customer boost.',[{title:'Flyer campaign · ₦2,000',desc:'Small local promotion',run:()=>advertiseBusiness(2000,1)},{title:'Radio promotion · ₦7,500',desc:'Wider city reach',run:()=>advertiseBusiness(7500,2)},{title:'Citywide campaign · ₦20,000',desc:'Big reputation boost',run:()=>advertiseBusiness(20000,4)}])}
 else if(name==='invest'){lifeModal('📈 In-game investments','This is a fictional game mechanic, not real investing.',[{title:'Invest ₦5,000',desc:'Set money aside',run:()=>investMoney(5000)},{title:'Invest ₦20,000',desc:'Set aside a larger amount',run:()=>investMoney(20000)},{title:'Cash out',desc:'Return savings with a simulated 5% bonus',run:()=>cashOutInvestment()}])}
 else if(name==='map'){lifeModal('🗺️ Ibadan districts','Choose a place to visit.',[{title:'Bodija Market',desc:'Shopping and food',run:()=>moveToDistrict(-15,-14,'Bodija Market',0)},{title:'UCH district',desc:'Hospital and services',run:()=>moveToDistrict(15,-14,'UCH district',0)},{title:'University area',desc:'Study and student life',run:()=>moveToDistrict(-15,14,'University area',0)},{title:'Dugbe Mall',desc:'Shopping and entertainment',run:()=>moveToDistrict(15,14,'Dugbe Mall',0)},{title:'Home',desc:'Return to your starting area',run:()=>{const s=STARTS[activeStart];if(s)moveToDistrict(s.spawn[0],s.spawn[1],'Home',0)}}])}
 else if(name==='food'){lifeModal('🍛 Food & groceries','Restore hunger using game money.',[{title:'Akara and pap · ₦800',desc:'+20 hunger',run:()=>buyFood(800,20)},{title:'Rice and stew · ₦1,500',desc:'+35 hunger',run:()=>buyFood(1500,35)},{title:'Amala, ewedu and gbegiri · ₦2,500',desc:'+50 hunger',run:()=>buyFood(2500,50)}])}
 else if(name==='events'){lifeModal('🎟️ City activities','Choose something to do around town.',[{title:'Football match · ₦1,000',desc:'Fun and social boost',run:()=>attendEvent(1000,20,10,'football match')},{title:'Cinema · ₦3,500',desc:'Fun boost',run:()=>attendEvent(3500,35,5,'cinema')},{title:'Community event · Free',desc:'Social boost',run:()=>attendEvent(0,10,20,'community event')}])}
 else if(name==='messages'){lifeModal('💬 Messages','Catch up with your neighbours.',[{title:'Message Ife',desc:'Increase social and fun',run:()=>socialChat('Ife')},{title:'Message Tobi',desc:'Increase social and fun',run:()=>socialChat('Tobi')},{title:'Contact an employer',desc:'Build reputation',run:()=>{social=Math.min(100,social+8);rep=Math.min(5,rep+.05);toast('📨 You made a useful connection');renderUI();saveGame()}}])}
 else if(name==='missions'){lifeModal('🧭 Local missions','Accept a task, then walk to its green marker in the 3D city. You earn game money and reputation when you arrive.',MISSION_LIST.map(m=>({title:m.title+' · +'+moneyText(m.reward),desc:m.description,run:()=>startMission(m.id)})))}
 else {toast(dLabel(name)+' opened')}
}
const MISSION_LIST=[
 {id:'market-delivery',title:'Bodija parcel delivery',description:'Deliver a parcel to Bodija Market. Reward: ₦8,500.',target:[-15,-14],place:'Bodija Market',reward:8500,minutes:25,progress:8},
 {id:'campus-assignment',title:'Submit campus assignment',description:'Reach the University area before the deadline. Reward: ₦5,000.',target:[-15,14],place:'University area',reward:5000,minutes:20,progress:12},
 {id:'dugbe-order',title:'Dugbe customer pickup',description:'Pick up an order at Dugbe Mall. Reward: ₦7,500.',target:[15,14],place:'Dugbe Mall',reward:7500,minutes:22,progress:8},
 {id:'uch-errand',title:'UCH document errand',description:'Take important documents to the UCH district. Reward: ₦7,000.',target:[15,-14],place:'UCH district',reward:7000,minutes:18,progress:7}
];
function startMission(id){const m=MISSION_LIST.find(x=>x.id===id);if(!m)return;activeMission=id;missionMarker.position.set(m.target[0],0,m.target[1]);missionMarker.visible=true;$('task').textContent=m.title+' → '+m.place;toast('🧭 Mission accepted: '+m.title);renderUI();saveGame()}
function updateMissionMarker(){const m=MISSION_LIST.find(x=>x.id===activeMission);missionMarker.visible=!!m;if(m){missionMarker.position.x=m.target[0];missionMarker.position.z=m.target[1];$('task').textContent=m.title+' → '+m.place}}
function checkMissionArrival(){const m=MISSION_LIST.find(x=>x.id===activeMission);if(!m)return;const d=Math.hypot(player.position.x-m.target[0],player.position.z-m.target[1]);if(d>4.2)return;money+=m.reward;gameMinutes+=m.minutes;progress=Math.min(100,progress+m.progress);rep=Math.min(5,rep+.15);fun=Math.min(100,fun+8);missionCompletions++;activeMission=null;missionMarker.visible=false;$('task').textContent='Mission complete! Choose another task.';$('place').textContent=m.place+' · Ibadan';toast('✅ '+m.title+' complete · +'+moneyText(m.reward));renderUI();saveGame()}
function moveToDistrict(x,z,label,cost){if(money<cost){toast('💸 Not enough money for this trip');return}money-=cost;player.position.set(x,0,z);gameMinutes+=cost?8:3;$('place').textContent=label+' · Ibadan';toast('🗺️ Arrived at '+label+(cost?' · −'+moneyText(cost):''));renderUI();saveGame()}
function simulateTrip(destination,cost,minutes){if(money<cost){toast('💸 You need '+moneyText(cost)+' for this trip');return}money-=cost;gameMinutes+=minutes;energy=Math.max(0,energy-5);hunger=Math.max(0,hunger-3);$('task').textContent='You visited '+destination+'. Full explorable maps for other states are planned for a future update.';toast('🚌 Arrived in '+destination+' · −'+moneyText(cost));renderUI();saveGame()}
function buyBusiness(name,cost,income){let businesses=[];try{businesses=JSON.parse(localStorage.getItem('ibadanLifeBusinesses')||'[]')}catch(e){}if(businesses.some(b=>b.name===name)){toast('🏢 You already own this business');return}if(money<cost){toast('💸 Not enough money to open this business');return}money-=cost;businesses.push({name,cost,income,lastCollected:gameMinutes});localStorage.setItem('ibadanLifeBusinesses',JSON.stringify(businesses));toast('🏢 Opened '+name);renderUI();saveGame()}
function collectBusinessIncome(){let businesses=[];try{businesses=JSON.parse(localStorage.getItem('ibadanLifeBusinesses')||'[]')}catch(e){}if(!businesses.length){toast('🏢 You do not own a business yet');return}const total=businesses.reduce((sum,b)=>sum+Math.max(500,Math.floor((b.income||2000)*.25)),0);money+=total;localStorage.setItem('ibadanLifeBusinesses',JSON.stringify(businesses.map(b=>({...b,lastCollected:gameMinutes}))));toast('💵 Business income · +'+moneyText(total));renderUI();saveGame()}
function advertiseBusiness(cost,repGain){let businesses=[];try{businesses=JSON.parse(localStorage.getItem('ibadanLifeBusinesses')||'[]')}catch(e){}if(!businesses.length){toast('📢 Buy a business before advertising');return}if(money<cost){toast('💸 Not enough money for this campaign');return}money-=cost;rep=Math.min(5,rep+repGain*.08);localStorage.setItem('ibadanLifeBusinesses',JSON.stringify(businesses.map(b=>({...b,income:Math.round((b.income||2000)*(1+repGain*.05))}))));toast('📢 Campaign launched · reputation increased');renderUI();saveGame()}
let investmentBalance=Number(localStorage.getItem('ibadanLifeInvestment')||0);function investMoney(amount){if(money<amount){toast('💸 Not enough money to invest');return}money-=amount;investmentBalance+=amount;localStorage.setItem('ibadanLifeInvestment',String(investmentBalance));toast('📈 Invested '+moneyText(amount));renderUI();saveGame()}
function cashOutInvestment(){if(investmentBalance<=0){toast('📈 You have no investments to cash out');return}const payout=Math.round(investmentBalance*1.05);money+=payout;investmentBalance=0;localStorage.setItem('ibadanLifeInvestment','0');toast('📈 Cashed out · +'+moneyText(payout));renderUI();saveGame()}
function buyFood(cost,restore){if(money<cost){toast('💸 Not enough money for food');return}money-=cost;hunger=Math.min(100,hunger+restore);toast('🍛 Meal purchased · −'+moneyText(cost));renderUI();saveGame()}
function attendEvent(cost,funGain,socialGain,label){if(money<cost){toast('💸 Not enough money for this activity');return}money-=cost;fun=Math.min(100,fun+funGain);social=Math.min(100,social+socialGain);gameMinutes+=60;toast('🎟️ You attended a '+label);renderUI();saveGame()}
function socialChat(person){social=Math.min(100,social+15);fun=Math.min(100,fun+5);toast('💬 You chatted with '+person);renderUI();saveGame()}
function dLabel(n){return appCopy[n]?appCopy[n][0]:n}

document.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>openApp(b.dataset.app)));
$('closePhone').addEventListener('click',()=>{phone.classList.remove('show');phone.setAttribute('aria-hidden','true')});$('closeBuy').addEventListener('click',closeBuyMode);
function openPhone(){phone.classList.add('show');phone.setAttribute('aria-hidden','false')}
renderUI()
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('installBtn').classList.add('show')});
$('installBtn').addEventListener('click',async()=>{if(!deferredInstallPrompt){toast('📲 Use your browser menu → Install app');return}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('installBtn').classList.remove('show')});
window.addEventListener('appinstalled',()=>{$('installBtn').classList.remove('show');toast('📲 Ibadan Life installed')});
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
document.querySelectorAll('.bottom button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.bottom button').forEach(x=>x.classList.remove('active'));b.classList.add('active');const t=b.dataset.tab;if(t==='shop'){openBuyMode();return;}if(t==='map')toast('🗺️ Map: Market · Hospital · School · Mall');if(t==='phone'){openPhone();return};if(t==='home')toast('🏠 Home: your current life overview')}));
function setKey(k,v){keys[k]=v}document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();setKey(k,true);b.setPointerCapture(e.pointerId)});b.addEventListener('pointerup',()=>setKey(k,false));b.addEventListener('pointercancel',()=>setKey(k,false))});addEventListener('keydown',e=>{if(e.key.toLowerCase() in keys)setKey(e.key.toLowerCase(),true)});addEventListener('keyup',e=>{if(e.key.toLowerCase() in keys)setKey(e.key.toLowerCase(),false)});
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX});addEventListener('pointerup',()=>dragging=false);addEventListener('pointermove',e=>{if(dragging){camAngle+=(e.clientX-lastX)*.006;lastX=e.clientX}});
let saveTick=0;function update(dt){saveTick+=dt;if(saveTick>=3){saveTick=0;saveGame()}const speed=dt*(driving?9.2:4.2);let dx=(keys.d?1:0)-(keys.a?1:0),dz=(keys.s?1:0)-(keys.w?1:0);if(dx||dz){const len=Math.hypot(dx,dz);dx/=len;dz/=len;if(driving&&starterCar){starterCar.position.x+=dx*speed;starterCar.position.z+=dz*speed;starterCar.position.x=Math.max(-32,Math.min(32,starterCar.position.x));starterCar.position.z=Math.max(-32,Math.min(32,starterCar.position.z));starterCar.rotation.y=Math.atan2(dx,dz);player.position.set(starterCar.position.x,0,starterCar.position.z)}else{player.position.x+=dx*speed;player.position.z+=dz*speed;player.position.x=Math.max(-32,Math.min(32,player.position.x));player.position.z=Math.max(-32,Math.min(32,player.position.z));player.rotation.y=Math.atan2(dx,dz)}progress=Math.min(100,progress+dt*(driving?2.2:1.5))}gameMinutes+=dt*2.2;hunger=Math.max(0,hunger-dt*.45);energy=Math.max(0,energy-dt*.25);fun=Math.max(0,fun-dt*.12);social=Math.max(0,social-dt*.08);hygiene=Math.max(0,hygiene-dt*.1);bladder=Math.max(0,bladder-dt*.14);if(health<100&&energy>60)health=Math.min(100,health+dt*.04);npcs.forEach((n,i)=>{n.t+=dt*(.35+i*.04);n.g.position.x=n.baseX+Math.sin(n.t+n.phase)*1.8;n.g.position.z=n.baseZ+Math.cos(n.t*.8+n.phase)*1.5;n.g.rotation.y=Math.sin(n.t)*.25});if(activeMission){markerRing.rotation.z+=dt*.8;checkMissionArrival()}const target=new THREE.Vector3(player.position.x,1.8,player.position.z);const cp=Math.cos(camAngle),sp=Math.sin(camAngle);camera.position.x=player.position.x+cp*camDistance;camera.position.z=player.position.z+sp*camDistance;camera.position.y=15;camera.lookAt(target);renderUI()}
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});renderUI();showStart();requestAnimationFrame(loop);
})();