const DB_NAME="aashirwaad_offline_pos",DB_VERSION=1;let db,cart=[],lastSale=null,cameraStream=null,scanLoop=null;
const $=id=>document.getElementById(id),money=n=>"₹"+Number(n||0).toFixed(2);
function uid(){return crypto.randomUUID?crypto.randomUUID():"id-"+Date.now()+"-"+Math.random().toString(16).slice(2)}
function openDB(){return new Promise((resolve,reject)=>{let r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{let d=r.result;["products","sales","outbox","settings"].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:s==="outbox"?"eventId":s==="settings"?"key":"id"})})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function reqP(r){return new Promise((a,b)=>{r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error)})}async function all(s){return reqP(db.transaction(s).objectStore(s).getAll())}async function put(s,v){return reqP(db.transaction(s,"readwrite").objectStore(s).put(v))}async function get(s,k){return reqP(db.transaction(s).objectStore(s).get(k))}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function queueEvent(type,payload){await put("outbox",{eventId:uid(),type,payload,createdAt:new Date().toISOString()});await updateStatus()}
async function updateStatus(){let q=await all("outbox");$("pendingCount").textContent=q.length;$("network").textContent=navigator.onLine?"Online":"Offline";let u=await get("settings","apiUrl");$("syncStatus").textContent=u?.value?(navigator.onLine?"Ready to sync":"Waiting for internet"):"Local only"}
function tabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("hidden",p.id!==b.dataset.tab));if(b.dataset.tab==="products")renderProducts();if(b.dataset.tab==="history")renderSales()})}
async function renderProducts(){let ps=await all("products");$("productList").innerHTML=ps.length?ps.map(p=>`<div class="item"><div><b>${esc(p.name)}</b><small>${esc(p.barcode||"No barcode")} · Stock ${p.stock}${p.expiry?" · Exp "+p.expiry:""}</small></div><b>${money(p.price)}</b></div>`).join(""):'<div class="empty">No products saved</div>'}
async function findProduct(code){let ps=await all("products");return ps.find(p=>p.barcode===code||p.id===code)}
function addToCart(p){let f=cart.find(x=>x.productId===p.id);if(f)f.qty++;else cart.push({productId:p.id,name:p.name,price:Number(p.price),qty:1});renderCart()}
function renderCart(){$("cart").className="list"+(cart.length?"":" empty");$("cart").innerHTML=cart.length?cart.map((x,i)=>`<div class="item"><div><b>${esc(x.name)}</b><small>${money(x.price)} × ${x.qty}</small></div><div><b>${money(x.price*x.qty)}</b> <button data-minus="${i}">−</button> <button data-plus="${i}">+</button> <button data-remove="${i}">×</button></div></div>`).join(""):"Cart is empty";$("cart").querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{let x=cart[+b.dataset.minus];x.qty--;if(x.qty<=0)cart.splice(+b.dataset.minus,1);renderCart()});$("cart").querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{cart[+b.dataset.plus].qty++;renderCart()});$("cart").querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);renderCart()});$("total").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0))}
async function addBarcode(){let code=$("scanCode").value.trim();if(!code)return;let p=await findProduct(code);if(!p){alert("Barcode not found. First add this product in Products.");$("scanCode").select();return}addToCart(p);$("scanCode").value="";$("scanCode").focus()}
$("addCode").onclick=addBarcode;$("scanCode").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addBarcode()}});
$("quickAdd").onclick=()=>{let name=$("quickName").value.trim(),price=Number($("quickPrice").value);if(!name||!(price>=0)){alert("Enter item name and valid price");return}cart.push({productId:null,name,price,qty:1});$("quickName").value=$("quickPrice").value="";renderCart()};
$("saveProduct").onclick=async()=>{let barcode=$("pBarcode").value.trim(),name=$("pName").value.trim(),price=Number($("pPrice").value),cost=Number($("pCost").value||0),stock=Number($("pStock").value||0);if(!name||!(price>=0)){alert("Enter product name and selling price");return}let existing=barcode?await findProduct(barcode):null;if(existing){alert("This barcode already exists. Use a different barcode or edit the existing product.");return}let p={id:uid(),barcode,name,price,cost,stock,expiry:$("pExpiry").value,updatedAt:new Date().toISOString()};await put("products",p);await queueEvent("product.upsert",p);["pBarcode","pName","pPrice","pCost","pStock","pExpiry"].forEach(id=>$(id).value="");await renderProducts();alert("Product saved offline")};
$("completeSale").onclick=async()=>{if(!cart.length){alert("Cart is empty");return}let sale={id:uid(),billNo:"AS-"+new Date().toISOString().replace(/\D/g,"").slice(0,14),items:cart.map(x=>({...x})),total:cart.reduce((s,x)=>s+x.price*x.qty,0),payment:$("payment").value,customer:$("customer").value.trim(),createdAt:new Date().toISOString(),deviceId:localStorage.getItem("aashirwaadDeviceId")||uid()};localStorage.setItem("aashirwaadDeviceId",sale.deviceId);await put("sales",sale);for(let line of sale.items){if(line.productId){let p=await get("products",line.productId);if(p){p.stock=Math.max(0,Number(p.stock)-line.qty);p.updatedAt=new Date().toISOString();await put("products",p)}}}await queueEvent("sale.created",sale);lastSale=sale;cart=[];$("customer").value="";renderCart();$("printLast").disabled=$("whatsappLast").disabled=false;alert("Bill saved offline: "+sale.billNo+"\\nUse Print or WhatsApp bill.");};
function receiptHTML(s){return `<h3>Aashirwaad Super Mart</h3><div class="center">Thank you for shopping</div><hr><div>Bill: ${esc(s.billNo)}</div><div>${new Date(s.createdAt).toLocaleString()}</div><div>Customer: ${esc(s.customer||"Walk-in")}</div><hr>${s.items.map(x=>`<div>${esc(x.name)}</div><div class="rline"><span>${x.qty} × ${money(x.price)}</span><b>${money(x.qty*x.price)}</b></div>`).join("")}<hr><div class="rline"><b>TOTAL</b><b>${money(s.total)}</b></div><div>Payment: ${esc(s.payment)}</div><hr><div class="center">Visit again!</div>`}
function printSale(s){if(!s)return;let r=$("receipt");r.innerHTML=receiptHTML(s);window.print()}
function whatsappSale(s){if(!s)return;let lines=["*Aashirwaad Super Mart*","Bill: "+s.billNo,"Date: "+new Date(s.createdAt).toLocaleString(),"Customer: "+(s.customer||"Walk-in"),"--------------------",...s.items.map(x=>`${x.name}  ${x.qty} x ${money(x.price)} = ${money(x.qty*x.price)}`),"--------------------","*Total: "+money(s.total)+"*","Payment: "+s.payment,"Thank you for shopping!"];let url="https://wa.me/?text="+encodeURIComponent(lines.join("\\n"));window.open(url,"_blank")}
$("printLast").onclick=()=>printSale(lastSale);$("whatsappLast").onclick=()=>whatsappSale(lastSale);
async function renderSales(){let ss=(await all("sales")).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));$("salesList").className="list"+(ss.length?"":" empty");$("salesList").innerHTML=ss.length?ss.map(s=>`<div class="item"><div><b>${esc(s.billNo)}</b><small>${new Date(s.createdAt).toLocaleString()} · ${esc(s.payment)}</small></div><div><b>${money(s.total)}</b><br><button data-print="${s.id}">Print</button> <button data-wa="${s.id}">WhatsApp</button></div></div>`).join(""):"No sales yet";$("salesList").querySelectorAll("[data-print]").forEach(b=>b.onclick=async()=>printSale(await get("sales",b.dataset.print)));$("salesList").querySelectorAll("[data-wa]").forEach(b=>b.onclick=async()=>whatsappSale(await get("sales",b.dataset.wa)))}
let barcodeModal=null,barcodeReader=null,barcodeControls=null,barcodeTarget=null;
function loadZXing(){
 if(window.ZXing&&window.ZXing.BrowserMultiFormatReader)return Promise.resolve(window.ZXing);
 if(window.__aashirwaadZXingPromise)return window.__aashirwaadZXingPromise;
 window.__aashirwaadZXingPromise=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
  script.async=true;
  script.onload=()=>window.ZXing&&window.ZXing.BrowserMultiFormatReader?resolve(window.ZXing):reject(new Error("Barcode library did not initialize"));
  script.onerror=()=>reject(new Error("Could not download barcode scanner. Connect to internet once and retry."));
  document.head.appendChild(script);
 });
 return window.__aashirwaadZXingPromise;
}
function stopCamera(){
 try{if(barcodeControls&&barcodeControls.stop)barcodeControls.stop()}catch(e){}
 barcodeControls=null;
 try{if(barcodeReader&&barcodeReader.reset)barcodeReader.reset()}catch(e){}
 barcodeReader=null;
 if(barcodeModal){barcodeModal.remove();barcodeModal=null;}
 barcodeTarget=null;
}
async function cameraStart(targetId){
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.isSecureContext){alert("Camera scan ke liye GitHub Pages ka HTTPS URL Safari mein kholen aur Camera permission allow karein.");return}
 stopCamera();barcodeTarget=targetId;
 const modal=document.createElement("div");modal.className="scanner-overlay";barcodeModal=modal;
 const title=document.createElement("b");title.textContent="Aashirwaad — Barcode Scanner";
 const video=document.createElement("video");video.setAttribute("playsinline","");video.setAttribute("autoplay","");video.muted=true;
 const status=document.createElement("div");status.className="scan-status";status.textContent="Scanner load ho raha hai… Internet connection zaroori ho sakta hai pehli baar.";
 const close=document.createElement("button");close.textContent="Close scanner";close.onclick=stopCamera;
 modal.append(title,video,status,close);document.body.append(modal);
 try{
  const ZX=await loadZXing();if(barcodeModal!==modal)return;
  barcodeReader=new ZX.BrowserMultiFormatReader();
  status.textContent="Camera permission allow karein, phir barcode ko frame mein rakhein.";
  barcodeControls=await barcodeReader.decodeFromVideoDevice(undefined,video,(result,err)=>{
   if(!result||barcodeModal!==modal)return;
   const code=result.getText();const target=$(targetId);
   if(!target)return;
   target.value=code;target.dispatchEvent(new Event("input",{bubbles:true}));target.dispatchEvent(new Event("change",{bubbles:true}));
   status.textContent="Barcode scanned: "+code;
   stopCamera();target.focus();
   if(targetId==="scanCode")addBarcode();
  });
  status.textContent="Barcode ko camera ke beech mein rakhein. Focus hone tak phone steady rakhein.";
 }catch(e){
  status.textContent="Camera scanner start nahi hua: "+(e.message||e)+". Safari Settings mein Camera permission check karein, internet on karke retry karein.";
  const retry=document.createElement("button");retry.textContent="Retry";retry.onclick=()=>cameraStart(targetId);modal.insertBefore(retry,close);
 }
}
$("cameraScan").onclick=()=>cameraStart("scanCode");
$("productCameraScan").onclick=()=>cameraStart("pBarcode");
async function saveSettings(){await put("settings",{key:"apiUrl",value:$("apiUrl").value.trim().replace(/\/$/,"")});await put("settings",{key:"syncToken",value:$("syncToken").value.trim()});$("settingsMessage").textContent="Settings saved on this device.";updateStatus()}
async function syncNow(){if(!navigator.onLine){$("settingsMessage").textContent="Offline: changes remain saved locally.";return}let url=(await get("settings","apiUrl"))?.value,token=(await get("settings","syncToken"))?.value;if(!url||!token){$("settingsMessage").textContent="Cloud sync server is not configured yet. Local billing works.";return}try{let pending=await all("outbox");if(!pending.length){$("settingsMessage").textContent="No pending changes.";return}let res=await fetch(url+"/sync",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({events:pending})});if(!res.ok)throw Error("Server error "+res.status);let result=await res.json(),tx=db.transaction("outbox","readwrite");pending.forEach(e=>tx.objectStore("outbox").delete(e.eventId));await new Promise((a,b)=>{tx.oncomplete=a;tx.onerror=()=>b(tx.error)});$("settingsMessage").textContent="Uploaded "+(result.accepted??pending.length)+" event(s). Cloud download/sync-back still needs implementation.";updateStatus()}catch(e){$("settingsMessage").textContent="Sync failed; local data is safe. "+e.message}}
async function exportData(){let data={products:await all("products"),sales:await all("sales"),outbox:await all("outbox"),exportedAt:new Date().toISOString()},blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="aashirwaad-pos-backup.json";a.click();URL.revokeObjectURL(a.href)}
async function init(){db=await openDB();tabs();$("saveSettings").onclick=saveSettings;$("syncNow").onclick=syncNow;$("exportData").onclick=exportData;window.addEventListener("online",()=>{updateStatus();syncNow()});window.addEventListener("offline",updateStatus);let u=await get("settings","apiUrl"),t=await get("settings","syncToken");$("apiUrl").value=u?.value||"";$("syncToken").value=t?.value||"";await updateStatus();renderCart();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.error)}
init().catch(e=>alert("Could not start local database: "+e.message));