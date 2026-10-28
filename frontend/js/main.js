import {gsap} from 'gsap';import * as THREE from 'three';
const $=(s)=>document.querySelector(s), el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const api=async(url,options={})=>{const r=await fetch(url,{credentials:'same-origin',...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...options.headers}});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||`HTTP ${r.status}`);return data};
const json=(method,body)=>({method,body:JSON.stringify(body)});let motion=localStorage.getItem('motion')!=='off'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
function syncMotion(){document.body.classList.toggle('reduce-motion',!motion);document.querySelectorAll('.motion').forEach(b=>b.textContent=motion?'Tắt chuyển động':'Bật chuyển động')};syncMotion();document.querySelectorAll('.motion').forEach(b=>b.onclick=()=>{motion=!motion;localStorage.setItem('motion',motion?'on':'off');syncMotion()});
const placeholders=['Bạn chưa viết nội dung phần này.','Bạn chưa viết nội dung phần này.','Bạn chưa viết nội dung phần này.'];
function enableClickWords(messages){let previous=-1,active=0,last=0;document.addEventListener('pointerdown',e=>{if(!motion||!messages.length||active>=6||Date.now()-last<240)return;if(e.target.closest('button,a,input,textarea,select,label,form,dialog,[contenteditable],.photo-tile,.envelope'))return;last=Date.now();let i=Math.floor(Math.random()*messages.length);if(messages.length>1&&i===previous)i=(i+1)%messages.length;previous=i;const word=el('div','love-word',messages[i]);word.style.left=`${Math.max(10,Math.min(innerWidth-170,e.clientX))}px`;word.style.top=`${Math.max(10,e.clientY-20)}px`;document.body.append(word);active++;for(let j=0;j<6;j++){const spark=el('span','spark',j%2?'✦':'♡');spark.style.left=`${Math.random()*90}px`;spark.style.top='0';word.append(spark);gsap.to(spark,{x:(Math.random()-.5)*170,y:(Math.random()-.5)*110,opacity:0,duration:1.7})}gsap.fromTo(word,{scale:.3,opacity:0,y:10},{scale:1,opacity:1,y:-12,duration:.45,ease:'back.out(2)',onComplete:()=>gsap.to(word,{y:-90,opacity:0,duration:2,delay:.3,onComplete:()=>{word.remove();active--}})})},{passive:true})}
async function home(){const data=await api('/api/message');$('#welcome').textContent=data.welcomeTitle||'Bạn chưa viết lời chào.';$('#letterTitle').textContent=data.letterTitle||'Lá thư';$('#closingText').textContent=data.closingMessage||'Bạn chưa viết lời nhắn cuối.';const container=$('#reflections');data.reflections.forEach((v,i)=>{const c=el('article','card');c.append(el('span','num',`0${i+1}`),el('h3','',v.title||`Điều ${i+1}`),el('p','',v.body||placeholders[i]));container.append(c)});enableClickWords(data.clickMessages||[]);let opened=false;$('#envelope').onclick=()=>{if(opened)return;opened=true;$('#envelope').classList.add('open');$('#envelope').setAttribute('aria-expanded','true');const paper=$('#letterContent');paper.hidden=false;const text=$('#letterText');(data.letterParagraphs||[]).forEach((t,i)=>{const p=el('p','',t||'Bạn chưa viết đoạn này.');text.append(p);if(motion)gsap.from(p,{opacity:0,y:20,duration:.6,delay:i*.6})});if(motion)gsap.from(paper,{opacity:0,y:40,duration:.8})};$('#readBtn').onclick=()=>$('#readStatus').textContent='Cảm ơn vì đã đọc.';$('#replyBtn').onclick=()=>{$('#replyForm').hidden=false;$('#replyText').focus()};$('#replyForm').onsubmit=async e=>{e.preventDefault();const s=$('#replyStatus');try{await api('/api/replies',json('POST',{message:$('#replyText').value}));s.textContent='Lời nhắn đã được gửi. Cảm ơn cậu.';$('#replyForm').reset()}catch(err){s.textContent='Chưa gửi được: '+err.message}}}
let photos=[],selected=0,renderer,raf,sceneCleanup=()=>{};
function disposeScene(){sceneCleanup();sceneCleanup=()=>{};if(raf)cancelAnimationFrame(raf);raf=null;if(renderer){renderer.dispose();renderer.domElement.remove();renderer=null}}
function createHeart(){
  const host=$('#heartScene');
  if(!motion||!window.WebGLRenderingContext||!host)return;
  try{
    const scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x100b29,.022);
    const camera=new THREE.PerspectiveCamera(58,1,.1,160);
    camera.position.set(0,0,17);
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'default'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    host.append(renderer.domElement);
    const random=(a,b)=>a+Math.random()*(b-a);
    const starCount=850;
    const starPositions=new Float32Array(starCount*3);
    const starColors=new Float32Array(starCount*3);
    for(let i=0;i<starCount;i++){
      const radius=random(12,72),theta=random(0,Math.PI*2),phi=Math.acos(random(-1,1));
      starPositions.set([radius*Math.sin(phi)*Math.cos(theta),radius*Math.cos(phi),-Math.abs(radius*Math.sin(phi)*Math.sin(theta))],i*3);
      const c=new THREE.Color().setHSL(random(.66,.91),random(.25,.85),random(.65,1));
      starColors.set(c.toArray(),i*3);
    }
    const starsGeo=new THREE.BufferGeometry();
    starsGeo.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
    starsGeo.setAttribute('color',new THREE.BufferAttribute(starColors,3));
    const starsMat=new THREE.PointsMaterial({size:.115,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true,blending:THREE.AdditiveBlending});
    const stars=new THREE.Points(starsGeo,starsMat);scene.add(stars);
    const twinkles=[];
    for(let i=0;i<75;i++){
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({color:i%3?0xffc6ef:0xd9ceff,transparent:true,opacity:random(.25,.85),blending:THREE.AdditiveBlending,depthWrite:false}));
      sprite.position.set(random(-20,20),random(-12,12),random(-20,-3));
      const size=random(.035,.11);sprite.scale.set(size,size,1);scene.add(sprite);
      twinkles.push({sprite,size,phase:random(0,7),speed:random(.7,2.1)});
    }
    const heartShape=new THREE.Shape();
    heartShape.moveTo(0,-.35);
    heartShape.bezierCurveTo(-.25,-.1,-.7,.25,-.45,.52);
    heartShape.bezierCurveTo(-.2,.78,0,.52,0,.36);
    heartShape.bezierCurveTo(0,.52,.2,.78,.45,.52);
    heartShape.bezierCurveTo(.7,.25,.25,-.1,0,-.35);
    const heartGeo=new THREE.ShapeGeometry(heartShape,12);
    const hearts=[];
    for(let i=0;i<36;i++){
      const mat=new THREE.MeshBasicMaterial({color:i%3===0?0xff8bc9:i%3===1?0xffc4e6:0xc9a7ff,transparent:true,opacity:random(.35,.78),side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
      const mesh=new THREE.Mesh(heartGeo,mat);
      const scale=random(.15,.47);mesh.scale.setScalar(scale);
      mesh.position.set(random(-12,12),random(-8,8),random(-17,4));
      mesh.rotation.z=random(-.5,.5);scene.add(mesh);
      hearts.push({mesh,baseY:mesh.position.y,phase:random(0,7),speed:random(.3,.85),baseOpacity:mat.opacity});
    }
    const glowGeo=new THREE.BufferGeometry();
    const glowArr=new Float32Array(1500*3);
    for(let i=0;i<1500;i++){
      const t=random(0,Math.PI*2),r=random(.1,1);
      glowArr.set([Math.cos(t)*r*8,Math.sin(t)*r*4,random(-13,-3)],i*3);
    }
    glowGeo.setAttribute('position',new THREE.BufferAttribute(glowArr,3));
    const glow=new THREE.Points(glowGeo,new THREE.PointsMaterial({color:0xba7bf3,size:.055,transparent:true,opacity:.32,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(glow);
    const cards=[];const loader=new THREE.TextureLoader();
    const cardGeo=new THREE.PlaneGeometry(4.0,3.25);
    const fallbackCanvas=document.createElement('canvas');fallbackCanvas.width=128;fallbackCanvas.height=168;
    const fctx=fallbackCanvas.getContext('2d');fctx.fillStyle='#efc6e9';fctx.fillRect(0,0,128,168);fctx.fillStyle='#b05b94';fctx.font='54px serif';fctx.textAlign='center';fctx.fillText('♡',64,102);
    const fallbackTexture=new THREE.CanvasTexture(fallbackCanvas);fallbackTexture.colorSpace=THREE.SRGBColorSpace;
    photos.forEach((p,i)=>{
      const angle=(i/5)*Math.PI*2-Math.PI/2;
      const material=new THREE.MeshBasicMaterial({map:fallbackTexture,side:THREE.DoubleSide,transparent:true});
      const mesh=new THREE.Mesh(cardGeo,material);
      mesh.position.set(Math.cos(angle)*6.1,Math.sin(angle)*2.6,Math.sin(angle)*2.1-1);
      mesh.rotation.y=-Math.cos(angle)*.22;
      mesh.userData.photoIndex=i;scene.add(mesh);
      const border=new THREE.LineSegments(new THREE.EdgesGeometry(cardGeo),new THREE.LineBasicMaterial({color:0xffd9f4,transparent:true,opacity:.85}));
      border.position.z=.015;mesh.add(border);
      cards.push({mesh,baseY:mesh.position.y,phase:i*1.4});
      if(p.imageUrl)loader.load(p.imageUrl,texture=>{if(!renderer){texture.dispose();return}texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true},undefined,()=>{});
    });
    let pointerX=0,pointerY=0,dragX=0,dragY=0,down=null,dragged=false;
    const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    const onDown=e=>{down={x:e.clientX,y:e.clientY};dragged=false;host.setPointerCapture?.(e.pointerId)};
    const onMove=e=>{const rect=host.getBoundingClientRect();pointerX=((e.clientX-rect.left)/rect.width-.5)*2;pointerY=((e.clientY-rect.top)/rect.height-.5)*2;if(down){dragX+=(e.movementX||0)*.005;dragY+=(e.movementY||0)*.003;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)dragged=true}};
    const onUp=e=>{if(!down)return;down=null;if(dragged)return;const rect=host.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(cards.map(c=>c.mesh),false)[0];if(hit)openPhoto(hit.object.userData.photoIndex)};
    host.addEventListener('pointerdown',onDown);host.addEventListener('pointermove',onMove);host.addEventListener('pointerup',onUp);
    const resize=()=>{if(!renderer)return;const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);camera.aspect=w/h;camera.position.z=w<600?24:17;camera.updateProjectionMatrix();renderer.setSize(w,h)};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const clock=new THREE.Clock();
    const render=()=>{
      if(!renderer)return;const t=clock.getElapsedTime();
      camera.position.x+=(pointerX*.65+dragX-camera.position.x)*.025;
      camera.position.y+=(-pointerY*.4-dragY-camera.position.y)*.025;
      camera.lookAt(0,0,0);
      stars.rotation.y=t*.004;starsMat.opacity=.78+Math.sin(t*1.2)*.15;
      glow.rotation.z=t*.014;
      twinkles.forEach(o=>{const v=.55+.45*Math.sin(t*o.speed*3+o.phase);o.sprite.material.opacity=.15+v*.8;o.sprite.scale.setScalar(o.size*(.65+v*.8))});
      hearts.forEach(o=>{o.mesh.position.y=o.baseY+Math.sin(t*o.speed+o.phase)*.38;o.mesh.rotation.z=Math.sin(t*.5+o.phase)*.2;o.mesh.material.opacity=o.baseOpacity*(.7+.3*Math.sin(t*1.3+o.phase))});
      cards.forEach(o=>{o.mesh.position.y=o.baseY+Math.sin(t*.7+o.phase)*.23;o.mesh.rotation.y=Math.sin(t*.35+o.phase)*.12;o.mesh.rotation.z=Math.sin(t*.4+o.phase)*.035});
      renderer.render(scene,camera);raf=requestAnimationFrame(render);
    };render();
    sceneCleanup=()=>{observer.disconnect();host.removeEventListener('pointerdown',onDown);host.removeEventListener('pointermove',onMove);host.removeEventListener('pointerup',onUp);scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>{if(m.map&&m.map!==fallbackTexture)m.map.dispose();m.dispose()})}});fallbackTexture.dispose()};
  }catch(e){console.warn('Không thể khởi tạo vũ trụ 3D; dùng thư viện ảnh dự phòng',e);disposeScene();host.classList.add('scene-fallback')}
}
function drawPhotos(){const g=$('#photoGallery');g.replaceChildren();photos.forEach((p,i)=>{const tile=el('button','photo-tile');tile.type='button';tile.setAttribute('aria-label',`Xem ảnh ${i+1}`);if(p.imageUrl){const img=el('img');img.src=p.imageUrl;img.alt=p.title||`Ảnh ${i+1}`;img.loading='lazy';tile.append(img)}else tile.append(el('div','photo-placeholder','♡'));tile.append(el('span','',p.title||`Ảnh ${i+1}`));if(innerWidth>750)tile.style.transform=`translateY(${i%2?25:-20}px) rotateY(${(i-2)*-12}deg)`;tile.onclick=()=>openPhoto(i);g.append(tile)})}
function openPhoto(i){selected=(i+photos.length)%photos.length;const p=photos[selected];$('#dialogImage').hidden=!p.imageUrl;if(p.imageUrl)$('#dialogImage').src=p.imageUrl;$('#dialogTitle').textContent=p.title||`Ảnh ${selected+1}`;$('#dialogMessage').textContent=p.message||'Bạn chưa viết lời nhắn cho ảnh này.';$('#photoDialog').showModal()}
async function gift(){
  try { photos=await api('/api/photos'); }
  catch(e) { console.warn('Không tải được dữ liệu ảnh từ MySQL',e); photos=[]; }
  photos=Array.from({length:5},(_,i)=>({
    ...(photos.find(p=>Number(p.id)===i+1)||{id:i+1,title:`Ảnh ${i+1}`,message:''}),
    imageUrl:`/images/photo${i+1}.jpg`
  }));
  drawPhotos();let opened=false;const show=()=>{if(opened)return;opened=true;$('#giftIntro').hidden=true;$('#gallery').hidden=false;createHeart();$('#gallery').scrollIntoView({behavior:motion?'smooth':'instant'})};$('#openGift').onclick=()=>{if(!motion)return show();gsap.timeline({onComplete:show}).to('#giftbox',{rotation:-5,duration:.12,yoyo:true,repeat:3}).to('.gift-lid',{rotation:-28,y:-55,duration:.75,ease:'power2.out'}).to('.gift-ribbon',{opacity:0,duration:.4},'<').to('.gift-glow',{scale:1.6,opacity:1,duration:.55},'<')};$('#skipGift').onclick=show;$('#closeGift').onclick=()=>{disposeScene();$('#heartScene').classList.remove('scene-fallback');$('#gallery').hidden=true;$('#giftIntro').hidden=false;opened=false;$('#giftbox').removeAttribute('style');$('.gift-lid').removeAttribute('style');$('.gift-ribbon').removeAttribute('style');$('.gift-glow').removeAttribute('style')};$('#dialogClose').onclick=()=>$('#photoDialog').close();$('#prevPhoto').onclick=()=>openPhoto(selected-1);$('#nextPhoto').onclick=()=>openPhoto(selected+1)}
const fields=[['recipientName','Tên người nhận'],['welcomeTitle','Lời chào'],['letterTitle','Tiêu đề lá thư'],['closingMessage','Lời nhắn cuối']];let content;
function field(parent,label,value,onChange,long=false){const wrap=el('div','field'),lab=el('label','',label),inp=el(long?'textarea':'input');inp.value=value||'';inp.oninput=()=>onChange(inp.value);wrap.append(lab,inp);parent.append(wrap);return inp}
function editContent(){const area=$('#contentFields');area.replaceChildren();fields.forEach(([key,label])=>field(area,label,content[key],v=>content[key]=v,key==='closingMessage'));content.letterParagraphs.forEach((v,i)=>field(area,`Đoạn thư ${i+1}`,v,t=>content.letterParagraphs[i]=t,true));content.reflections.forEach((r,i)=>{field(area,`Điều ${i+1}: Tiêu đề`,r.title,t=>r.title=t);field(area,`Điều ${i+1}: Nội dung`,r.body,t=>r.body=t,true)});field(area,'Câu chữ khi chạm màn hình (mỗi dòng một câu)',content.clickMessages.join('\n'),v=>content.clickMessages=v.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,40),true)}
async function admin(){const status=$('#adminStatus');const load=async()=>{const me=await api('/api/admin/me');$('#loginForm').hidden=me.authenticated;$('#adminArea').hidden=!me.authenticated;if(!me.authenticated)return;content=await api('/api/message');editContent();const ps=await api('/api/photos'),wrap=$('#photoFields');wrap.replaceChildren();ps.forEach(p=>{const box=el('div','photo-edit');box.append(el('h3','',`Ảnh ${p.id}`));if(p.imageUrl){const img=el('img');img.src=p.imageUrl;box.append(img)}let title=p.title,message=p.message,order=p.sort_order;field(box,'Tiêu đề',title,v=>title=v);field(box,'Lời nhắn',message,v=>message=v,true);field(box,'Thứ tự (1–5)',order,v=>order=Number(v));const save=el('button','btn outline','Lưu thông tin ảnh');save.onclick=async()=>{try{await api(`/api/admin/photos/${p.id}`,json('PUT',{title,message,sort_order:order}));status.textContent='Đã lưu ảnh '+p.id}catch(e){status.textContent=e.message}};box.append(save);const input=el('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';box.append(input);const up=el('button','btn','Tải ảnh lên');up.onclick=async()=>{if(!input.files[0])return;const f=new FormData();f.append('photo',input.files[0]);try{await api(`/api/admin/photos/${p.id}/upload`,{method:'POST',body:f});status.textContent='Đã tải ảnh '+p.id;await load()}catch(e){status.textContent=e.message}};box.append(up);wrap.append(box)})};$('#loginForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/login',json('POST',{email:$('#email').value,password:$('#password').value}));$('#password').value='';await load();status.textContent='Đăng nhập thành công'}catch(e){status.textContent=e.message}};$('#logout').onclick=async()=>{await api('/api/admin/logout',{method:'POST'});await load()};$('#saveContent').onclick=async()=>{try{await api('/api/admin/content',json('PUT',content));status.textContent='Đã lưu nội dung'}catch(e){status.textContent=e.message}};$('#refreshReplies').onclick=async()=>{try{const replies=await api('/api/admin/replies'),wrap=$('#replies');wrap.replaceChildren();replies.forEach(r=>wrap.append(el('p','',`${new Date(r.created_at).toLocaleString('vi-VN')}: ${r.message}`)))}catch(e){status.textContent=e.message}};await load()}
(async()=>{try{if(document.body.dataset.page==='home')await home();if(document.body.dataset.page==='gift')await gift();if(document.body.dataset.page==='admin')await admin()}catch(e){console.error(e);const p=el('p','',`Không tải được dữ liệu: ${e.message}`);p.style.textAlign='center';document.querySelector('main')?.prepend(p)}})();
