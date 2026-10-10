/* Ibadan Life multiplayer UI. Requires multiplayer-config.js and Supabase JS v2 UMD. */
(() => {
  'use strict';
  const config = window.IBADAN_SUPABASE_CONFIG || {};
  const configured = /^https:\/\/[^/]+\.supabase\.co$/.test(config.url || '') &&
    typeof config.publishableKey === 'string' && config.publishableKey.length > 10;
  const host = () => document.getElementById('appPanel');
  let client = null, user = null, profile = null, currentRoom = null, channel = null, presenceChannel = null;
  let refreshToken = 0, online = new Map(), activeDM = null, activeDMName = '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const el = (tag, cls, text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; };
  const state = message => { const node=document.querySelector('#ibadanMpStatus'); if(node)node.textContent=message; };
  const stopChannels = async () => {
    if(channel && client) await client.removeChannel(channel).catch(()=>{});
    if(presenceChannel && client) await client.removeChannel(presenceChannel).catch(()=>{});
    channel=null; presenceChannel=null; online.clear();
  };
  const shell = () => {
    const panel=host(); if(!panel)return;
    panel.innerHTML = `
      <section class="ibadan-mp">
        <div class="ibadan-mp-head"><div><h3>💬 Community</h3><p id="ibadanMpStatus">Checking multiplayer setup…</p></div><span class="ibadan-mp-pill" id="ibadanMpOnline">0 online</span></div>
        <div id="ibadanMpAuth" class="ibadan-mp-auth"></div>
        <div id="ibadanMpGame" hidden>
          <div class="ibadan-mp-tabs"><button type="button" data-mp-view="rooms" class="active">Rooms</button><button type="button" data-mp-view="people">Players</button><button type="button" data-mp-view="dm" id="ibadanMpDmTab" disabled>Direct message</button><button type="button" id="ibadanMpSignOut">Sign out</button></div>
          <div class="ibadan-mp-roombar"><label for="ibadanMpRoom">Chat room</label><select id="ibadanMpRoom"></select></div>
          <div id="ibadanMpMessages" class="ibadan-mp-messages" aria-live="polite"></div>
          <form id="ibadanMpSend" class="ibadan-mp-send"><input id="ibadanMpText" maxlength="500" autocomplete="off" placeholder="Message the room…" aria-label="Chat message" required><button type="submit">Send</button></form>
          <div id="ibadanMpPeople" class="ibadan-mp-people" hidden></div>
          <div id="ibadanMpDm" class="ibadan-mp-dm" hidden><p id="ibadanMpDmTitle">Choose a player to message.</p><div id="ibadanMpDmMessages" class="ibadan-mp-messages"></div><form id="ibadanMpDmSend" class="ibadan-mp-send"><input id="ibadanMpDmText" maxlength="500" autocomplete="off" placeholder="Private message…" required><button type="submit">Send</button></form></div>
        </div>
      </section>`;
    panel.querySelectorAll('[data-mp-view]').forEach(btn=>btn.addEventListener('click',()=>view(btn.dataset.mpView)));
    panel.querySelector('#ibadanMpSignOut').addEventListener('click',async()=>{await stopChannels();await client.auth.signOut();user=null;profile=null;activeDM=null;render();});
    panel.querySelector('#ibadanMpRoom').addEventListener('change',e=>joinRoom(e.target.value));
    panel.querySelector('#ibadanMpSend').addEventListener('submit',sendRoomMessage);
    panel.querySelector('#ibadanMpDmSend').addEventListener('submit',sendDMMessage);
  };
  const renderAuth = () => {
    const node=document.querySelector('#ibadanMpAuth'); if(!node)return;
    node.innerHTML = `
      <form id="ibadanMpAuthForm" class="ibadan-mp-authform">
        <label>Display name<input id="ibadanMpDisplay" maxlength="24" placeholder="Your in-game name" autocomplete="nickname" required></label>
        <label>Username<input id="ibadanMpUsername" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" placeholder="letters, numbers, _" autocomplete="username" required></label>
        <label>Email<input id="ibadanMpEmail" type="email" maxlength="254" autocomplete="email" required></label>
        <label>Password<input id="ibadanMpPassword" type="password" minlength="8" maxlength="128" autocomplete="current-password" required></label>
        <div class="ibadan-mp-authbuttons"><button type="submit" data-mode="signin">Sign in</button><button type="button" data-mode="signup">Create account</button></div>
        <small>Use an email you control. Chat is for signed-in players; never share passwords or personal contact details in public rooms.</small>
      </form>`;
    const form=node.querySelector('form');
    form.querySelector('[data-mode="signin"]').addEventListener('click',()=>authenticate('signin'));
    form.querySelector('[data-mode="signup"]').addEventListener('click',()=>authenticate('signup'));
    form.addEventListener('submit',e=>{e.preventDefault();authenticate('signin');});
  };
  async function authenticate(mode){
    const email=document.querySelector('#ibadanMpEmail')?.value.trim();
    const password=document.querySelector('#ibadanMpPassword')?.value;
    const displayName=document.querySelector('#ibadanMpDisplay')?.value.trim();
    const username=document.querySelector('#ibadanMpUsername')?.value.trim().toLowerCase();
    if(!email||!password){state('Enter your email and password.');return;}
    if(mode==='signup' && (!displayName||! /^[a-z0-9_]{3,20}$/.test(username||''))){state('Add a display name and a username (3–20 letters, numbers or underscores).');return;}
    state(mode==='signup'?'Creating account…':'Signing in…');
    const buttons=document.querySelectorAll('.ibadan-mp-authbuttons button');buttons.forEach(b=>b.disabled=true);
    try{
      const result=mode==='signup'
        ? await client.auth.signUp({email,password,options:{data:{display_name:displayName.slice(0,24),username}}})
        : await client.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      if(mode==='signup'&&!result.data.session){state('Account created. Check your email to confirm it, then sign in.');return;}
      user=result.data.user;await loadProfile();await enterChat();
    }catch(e){state(e.message||'Authentication failed. Check the details and try again.');}
    finally{buttons.forEach(b=>b.disabled=false);}
  }
  async function loadProfile(){
    if(!user)return;
    const {data,error}=await client.from('ibadan_profiles').select('id,username,display_name').eq('id',user.id).maybeSingle();
    if(error)throw error;
    profile=data||{id:user.id,username:'player_'+user.id.slice(0,8),display_name:'Player'};
  }
  async function enterChat(){
    document.querySelector('#ibadanMpAuth').hidden=true;
    document.querySelector('#ibadanMpGame').hidden=false;
    state('Signed in as @'+profile.username);
    const {data,error}=await client.from('ibadan_chat_rooms').select('id,slug,name,room_type').eq('active',true).order('name');
    if(error)throw error;
    const select=document.querySelector('#ibadanMpRoom');
    select.innerHTML='';
    (data||[]).forEach(room=>{const option=el('option','',room.name);option.value=room.id;option.dataset.slug=room.slug;select.append(option);});
    await startPresence();
    if(data?.length)await joinRoom(data[0].id);
    await loadPeople();
    state('Signed in as @'+profile.username+' · messages are moderated by community rules');
  }
  async function startPresence(){
    if(presenceChannel)await client.removeChannel(presenceChannel);
    presenceChannel=client.channel('ibadan:presence:global',{config:{private:true,presence:{key:user.id}}});
    presenceChannel.on('presence',{event:'sync'},()=>{online.clear();const all=presenceChannel.presenceState();Object.entries(all).forEach(([id,items])=>{const p=items?.[0];if(p)online.set(id,p)});const badge=document.querySelector('#ibadanMpOnline');if(badge)badge.textContent=online.size+' online';renderPeople();});
    presenceChannel.subscribe(async status=>{
      if(status==='SUBSCRIBED'){
        await presenceChannel.track({user_id:user.id,username:profile.username,display_name:profile.display_name,online_at:new Date().toISOString()});
      } else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
        state('Presence connection failed. Check Realtime private-channel policies and project settings.');
      }
    });
  }
  async function joinRoom(roomId){
    if(!user||!roomId)return;
    currentRoom=roomId;activeDM=null;document.querySelector('#ibadanMpDm').hidden=true;document.querySelector('#ibadanMpPeople').hidden=true;document.querySelector('#ibadanMpMessages').hidden=false;document.querySelector('#ibadanMpSend').hidden=false;document.querySelector('#ibadanMpDmTab').disabled=true;
    if(channel)await client.removeChannel(channel);
    const token=++refreshToken;
    const roomSelect=document.querySelector('#ibadanMpRoom');const roomName=roomSelect?.selectedOptions?.[0]?.textContent||'Room';
    state('Loading '+roomName+'…');
    const list=document.querySelector('#ibadanMpMessages');list.replaceChildren();
    const {data,error}=await client.from('ibadan_room_messages').select('id,room_id,sender_id,body,created_at,ibadan_profiles(username,display_name)').eq('room_id',roomId).order('created_at',{ascending:false}).limit(60);
    if(token!==refreshToken)return;
    if(error){state(error.message||'Could not load messages.');return;}
    (data||[]).reverse().forEach(addRoomMessage);
    channel=client.channel('ibadan-room-'+roomId);
    channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'ibadan_room_messages',filter:'room_id=eq.'+roomId},async payload=>{
      if(token!==refreshToken)return;
      const row=payload.new;
      const {data:sender}=await client.from('ibadan_profiles').select('username,display_name').eq('id',row.sender_id).maybeSingle();
      addRoomMessage({...row,ibadan_profiles:sender});
    });
    channel.subscribe(status=>{if(status==='SUBSCRIBED')state(roomName+' · connected');else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')state('Room connection failed. Check Realtime is enabled and RLS policies are applied.');});
  }
  function addRoomMessage(row){
    const list=document.querySelector('#ibadanMpMessages');if(!list)return;
    if(list.querySelector('[data-message-id="'+CSS.escape(row.id)+'"]'))return;
    const sender=row.ibadan_profiles||{};const article=el('article','ibadan-mp-message');article.dataset.messageId=row.id;
    const meta=el('div','ibadan-mp-message-meta','@'+(sender.username||'player')+' · '+new Date(row.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));
    const body=el('p','ibadan-mp-message-body',row.body);article.append(meta,body);
    if(row.sender_id!==user.id){
      const actions=el('div','ibadan-mp-message-actions');
      const block=el('button','ibadan-mp-mini','Block');block.addEventListener('click',()=>blockPlayer(row.sender_id,sender.username||'player'));
      const report=el('button','ibadan-mp-mini','Report');report.addEventListener('click',()=>reportPlayer(row.sender_id,sender.username||'player'));
      actions.append(block,report);article.append(actions);
    }
    list.append(article);list.scrollTop=list.scrollHeight;
  }
  async function sendRoomMessage(event){
    event.preventDefault();const input=document.querySelector('#ibadanMpText');const body=input.value.trim();
    if(!body||!currentRoom||!user)return;if(body.length>500){state('Messages are limited to 500 characters.');return;}
    input.disabled=true;
    const {error}=await client.from('ibadan_room_messages').insert({room_id:currentRoom,sender_id:user.id,body});
    input.disabled=false;if(error){state(error.message||'Message not sent.');return;}input.value='';input.focus();
  }
  function view(name){
    document.querySelectorAll('[data-mp-view]').forEach(b=>b.classList.toggle('active',b.dataset.mpView===name));
    const roomMessages=document.querySelector('#ibadanMpMessages'),roomSend=document.querySelector('#ibadanMpSend');
    const people=document.querySelector('#ibadanMpPeople'),dm=document.querySelector('#ibadanMpDm');
    roomMessages.hidden=name!=='rooms';roomSend.hidden=name!=='rooms';people.hidden=name!=='people';dm.hidden=name!=='dm';
    document.querySelector('#ibadanMpRoom').parentElement.hidden=name!=='rooms';
    if(name==='people')loadPeople();
    if(name==='dm'&&activeDM)loadDM(activeDM);
  }
  async function loadPeople(){
    if(!user)return;
    const [{data:profiles,error}, {data:blocks}] = await Promise.all([
      client.from('ibadan_profiles').select('id,username,display_name').neq('id',user.id).order('display_name').limit(100),
      client.from('ibadan_blocks').select('blocked_id').eq('blocker_id',user.id)
    ]);
    if(error){state('Could not load player directory.');return;}
    const blocked=new Set((blocks||[]).map(x=>x.blocked_id));const list=document.querySelector('#ibadanMpPeople');if(!list)return;list.replaceChildren();
    (profiles||[]).filter(p=>!blocked.has(p.id)).forEach(p=>{
      const row=el('div','ibadan-mp-person');const dot=el('span',online.has(p.id)?'ibadan-mp-dot online':'ibadan-mp-dot');const label=el('div','ibadan-mp-person-label');label.append(el('strong','',p.display_name),el('small','','@'+p.username+(online.has(p.id)?' · online':'')));
      const start=el('button','ibadan-mp-mini','Message');start.addEventListener('click',()=>startDM(p));row.append(dot,label,start);list.append(row);
    });
    if(!list.childElementCount)list.append(el('p','ibadan-mp-empty','No other players yet. Invite a friend to create a second test account.'));
  }
  async function startDM(person){
    try{
      const {data,error}=await client.rpc('ibadan_start_dm',{other_user:person.id});if(error)throw error;
      activeDM=data;activeDMName=person.display_name;document.querySelector('#ibadanMpDmTab').disabled=false;document.querySelector('#ibadanMpDmTitle').textContent='Private chat with '+person.display_name;view('dm');await loadDM(activeDM);
    }catch(e){state(e.message||'Could not start a private conversation.');}
  }
  async function loadDM(conversationId){
    if(!user||!conversationId)return;
    if(channel)await client.removeChannel(channel);
    const token=++refreshToken;const list=document.querySelector('#ibadanMpDmMessages');list.replaceChildren();
    const {data,error}=await client.from('ibadan_dm_messages').select('id,conversation_id,sender_id,body,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(80);
    if(error){state('Could not load direct messages.');return;}
    (data||[]).forEach(row=>addDMMessage(row));
    channel=client.channel('ibadan-dm-'+conversationId);
    channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'ibadan_dm_messages',filter:'conversation_id=eq.'+conversationId},payload=>{if(token===refreshToken)addDMMessage(payload.new);});
    channel.subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')state('Direct-message connection failed.');});
  }
  function addDMMessage(row){
    const list=document.querySelector('#ibadanMpDmMessages');if(!list||list.querySelector('[data-message-id="'+CSS.escape(row.id)+'"]'))return;
    const article=el('article','ibadan-mp-message');article.dataset.messageId=row.id;article.append(el('div','ibadan-mp-message-meta',(row.sender_id===user.id?'You':'Player')+' · '+new Date(row.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})),el('p','ibadan-mp-message-body',row.body));list.append(article);list.scrollTop=list.scrollHeight;
  }
  async function sendDMMessage(event){
    event.preventDefault();if(!activeDM||!user)return;const input=document.querySelector('#ibadanMpDmText');const body=input.value.trim();if(!body)return;
    const {error}=await client.from('ibadan_dm_messages').insert({conversation_id:activeDM,sender_id:user.id,body});
    if(error){state(error.message||'Direct message not sent.');return;}input.value='';
  }
  async function blockPlayer(id,name){
    if(!confirm('Block @'+name+'? Their chat messages will be hidden from you and they cannot start a new DM with you.'))return;
    const {error}=await client.from('ibadan_blocks').upsert({blocker_id:user.id,blocked_id:id});
    if(error){state(error.message||'Could not block player.');return;}state('@'+name+' blocked.');await joinRoom(currentRoom);
  }
  async function reportPlayer(id,name){
    const reason=prompt('Report @'+name+' for: spam, harassment, inappropriate, impersonation, or other','harassment');
    if(!reason)return;const allowed=['spam','harassment','inappropriate','impersonation','other'];const value=reason.trim().toLowerCase();
    if(!allowed.includes(value)){state('Choose spam, harassment, inappropriate, impersonation, or other.');return;}
    const details=prompt('Optional details (max 500 characters)','')||'';
    const {error}=await client.from('ibadan_player_reports').insert({reporter_id:user.id,reported_id:id,reason:value,details:details.slice(0,500)});
    state(error?(error.message||'Could not submit report.'):'Report submitted. Thank you for helping keep the community safe.');
  }
  async function render(){
    shell();
    if(!configured){state('Multiplayer setup is not finished. Add the dedicated Ibadan Life Supabase URL and publishable key in multiplayer-config.js.');renderAuth();document.querySelector('#ibadanMpAuthForm').querySelectorAll('input,button').forEach(el=>el.disabled=true);return;}
    if(!window.supabase?.createClient){state('Multiplayer library did not load. Check your connection and reload.');renderAuth();return;}
    if(!client)client=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session},error}=await client.auth.getSession();
    if(error){state('Could not check sign-in: '+error.message);renderAuth();return;}
    if(session){user=session.user;try{await loadProfile();await enterChat();}catch(e){state(e.message||'Could not load player profile.');}}
    else{renderAuth();state('Sign in or create a player account to chat.');}
    client.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{if(event==='SIGNED_OUT'){await stopChannels();user=null;profile=null;render();}else if(session&&!user){user=session.user;try{await loadProfile();await enterChat();}catch(e){state(e.message||'Could not load player profile.');}}},0);});
  }
  window.IbadanMultiplayer={open:()=>{render().catch(e=>state(e.message||'Multiplayer failed to load.'));},isConfigured:()=>configured,queueSave:async saveData=>{
    if(!client||!user||!configured||!saveData)return;
    const {error}=await client.from('ibadan_game_saves').upsert({user_id:user.id,save_data:saveData,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)state('Cloud save not synced: '+error.message);
  }};
})();
