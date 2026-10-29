/* Maquetas de Papel: Paddle checkout recovery + guarded download verification */
(() => {
"use strict";
const root=document.querySelector("[data-recovery-product]");
if(!root)return;
const slug=root.dataset.recoveryProduct;
const worker="https://school-projects-india-downloads.gedeeldemailbox.workers.dev";
const token="live_6db2475f18adeb16a137f995a0d";
const pendingKey="maquetas_pending_"+slug;
const buttons=[...document.querySelectorAll("[data-buy-recovery]")];
let busy=false,verifying=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const valid=id=>/^txn_[a-z0-9]{10,80}$/.test(id||"");
const note=document.createElement("div");
note.setAttribute("role","status");note.setAttribute("aria-live","polite");
note.style.cssText="display:none;max-width:760px;margin:16px auto;padding:14px;border:1px solid #b96947;border-radius:8px;background:#fff6ee;color:#45251c;text-align:center";
root.insertAdjacentElement("afterend",note);
function status(msg,id){
 note.style.display="block";note.textContent=msg;
 if(valid(id)){
   const a=document.createElement("a");a.href=location.pathname+"?_ptxn="+encodeURIComponent(id);
   a.textContent=" Volver a abrir esta compra";a.style.marginLeft="8px";note.append(a);
 }
}
async function verify(id){
 if(verifying||!valid(id))return;
 verifying=true;status("Pago recibido. Verificando y preparando tu descarga…");
 try{
   const end=Date.now()+30000;
   do{
     try{
       const response=await fetch(worker+"/claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({transaction_id:id})});
       const data=await response.json();
       if(response.ok&&data.status==="ready"&&data.download_url){
         sessionStorage.removeItem(pendingKey);
         location.assign(data.download_url);return;
       }
       if(response.status!==409||data.status!=="pending")break;
     }catch(e){console.warn("Temporary verification failure",e)}
     if(Date.now()>=end)break;
     await wait(2500);
   }while(Date.now()<end);
   status("El pago puede haberse completado, pero la descarga aún no está lista. Conserva el recibo de Paddle y no vuelvas a pagar. Contacta con nosotros si continúa el problema.",id);
 }finally{verifying=false}
}
Paddle.Initialize({token,eventCallback:async event=>{
 if(event.name!=="checkout.completed")return;
 const id=event?.data?.transaction_id||event?.data?.transactionId||event?.data?.transaction?.id||sessionStorage.getItem(pendingKey);
 if(!valid(id)){status("Pago completado, pero no se identificó la transacción. Conserva tu recibo y contacta con nosotros. No vuelvas a pagar.");return}
 await verify(id);
}});
async function openNew(){
 if(busy)return;busy=true;
 buttons.forEach(b=>b.disabled=true);
 try{
   const r=await fetch(worker+"/create-spanish-recovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product:slug})});
   if(!r.ok)throw Error("Unable to create transaction");
   const data=await r.json();
   if(data.status!=="ok"||!valid(data.transactionId))throw Error("Invalid transaction");
   sessionStorage.setItem(pendingKey,data.transactionId);
   Paddle.Checkout.open({transactionId:data.transactionId});
 }catch(e){console.error(e);status("No pudimos abrir el pago. Inténtalo de nuevo más tarde.");}
 finally{busy=false;buttons.forEach(b=>b.disabled=false)}
}
buttons.forEach(b=>b.addEventListener("click",openNew));
const resume=new URLSearchParams(location.search).get("_ptxn");
if(valid(resume)){
 sessionStorage.setItem(pendingKey,resume);
 window.addEventListener("load",()=>{try{Paddle.Checkout.open({transactionId:resume})}catch(e){console.error(e);status("No se pudo reabrir el pago. Contacta con nosotros.",resume)}});
}
})();
