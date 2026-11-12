
document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://eboagroxkgpplccufpuk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";
  const authStorage = {
    getItem(key) { return localStorage.getItem(key) ?? sessionStorage.getItem(key); },
    setItem(key, value) { if (localStorage.getItem(key) !== null) localStorage.setItem(key, value); else sessionStorage.setItem(key, value); },
    removeItem(key) { localStorage.removeItem(key); sessionStorage.removeItem(key); }
  };
  const $ = id => document.getElementById(id);
  function initializeAccountMenu() {
    const notificationToggle = document.getElementById("notificationToggle");
    const notificationMenu = document.getElementById("notificationMenu");
    const closeMenus = () => {
      notificationMenu?.classList.remove("show");
      notificationToggle?.setAttribute("aria-expanded", "false");
    };
    notificationToggle?.addEventListener("click", event => {
      event.stopPropagation();
      const opening = !notificationMenu.classList.contains("show");
      closeMenus();
      if (opening) {
        notificationMenu.classList.add("show");
        notificationToggle.setAttribute("aria-expanded", "true");
      }
    });
    document.addEventListener("click", event => {
      if (!event.target.closest(".notification-dropdown")) closeMenus();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenus(); });
  }

  if (!document.querySelector(".dashboard-layout")) initializeAccountMenu();
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  const BUCKET = "private-kyc-documents";
  const MAX_BYTES = 2 * 1024 * 1024;
  let user = null, identityRow = null, addressRow = null, cameraStream = null, cameraTarget = null;
  const selectedFiles = { front: null, back: null, selfie: null, address: null };
  const countries = [
    ["BD","Bangladesh"],["US","United States"],["GB","United Kingdom"],["IN","India"],["PK","Pakistan"],["CA","Canada"],["AU","Australia"],["AE","United Arab Emirates"],["SA","Saudi Arabia"],["MY","Malaysia"],["SG","Singapore"],["DE","Germany"],["FR","France"],["IT","Italy"],["ES","Spain"],["NL","Netherlands"],["JP","Japan"],["KR","South Korea"],["CN","China"],["TR","Türkiye"],["BR","Brazil"],["ZA","South Africa"],["NG","Nigeria"],["ID","Indonesia"],["PH","Philippines"],["TH","Thailand"],["VN","Vietnam"],["LK","Sri Lanka"],["NP","Nepal"],["NZ","New Zealand"],["IE","Ireland"],["SE","Sweden"],["NO","Norway"],["DK","Denmark"],["CH","Switzerland"],["BE","Belgium"],["PT","Portugal"],["MX","Mexico"],["AR","Argentina"],["EG","Egypt"],["KE","Kenya"],["GH","Ghana"],["QA","Qatar"],["KW","Kuwait"],["OM","Oman"],["BH","Bahrain"],["RU","Russia"],["UA","Ukraine"],["PL","Poland"],["GR","Greece"],["AT","Austria"],["FI","Finland"],["CZ","Czechia"],["RO","Romania"],["HU","Hungary"],["IL","Israel"],["JO","Jordan"],["IQ","Iraq"],["AF","Afghanistan"],["MM","Myanmar"],["KH","Cambodia"],["ET","Ethiopia"],["TZ","Tanzania"],["UG","Uganda"],["MA","Morocco"],["TN","Tunisia"],["CL","Chile"],["CO","Colombia"],["PE","Peru"]
  ];
  const flag = code => String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
  function fillCountries(select) {
    countries.forEach(([code,name]) => { const option=document.createElement("option"); option.value=name; option.textContent=flag(code)+" "+name; select.appendChild(option); });
  }
  [ $("personalCountry"), $("idCountry"), $("addressCountry") ].forEach(fillCountries);
  function feedback(id, message, type="") { const el=$(id); if(el){el.textContent=message;el.className="form-feedback"+(type?" "+type:"");} }
  function setButton(id, busy, label) { const el=$(id); if(el){el.disabled=busy;el.textContent=busy?"Please wait...":label;} }
  function statusLabel(status) { return ({pending_review:"Pending Review",approved:"Verified",rejected:"Rejected"})[status] || "Not Submitted"; }
  function setStatus(id,status) { const el=$(id); if(el){el.textContent=statusLabel(status);el.dataset.status=status||"none";} }
  function renderOverall() {
    const states=[identityRow?.status,addressRow?.status].filter(Boolean);
    let status="unverified",label="Not Verified";
    if(states.includes("rejected")){status="rejected";label="Action Required";}
    else if(states.length && states.every(s=>s==="approved")){status="verified";label="Fully Verified";}
    else if(states.includes("pending_review")){status="pending_review";label="Under Review";}
    else if(states.includes("approved")){status="partial";label="Partially Verified";}
    $("overallStatus").dataset.status=status;$("overallStatus").lastElementChild.textContent=label;
    setStatus("identityTabStatus",identityRow?.status);setStatus("addressTabStatus",addressRow?.status);
    renderSubmissionStatus("identitySubmissionStatus",identityRow);
    renderSubmissionStatus("addressSubmissionStatus",addressRow);
    ["identity","address"].forEach(type=>{
      const row=type==="identity"?identityRow:addressRow;
      const blocked=row?.status==="pending_review"||row?.status==="approved";
      const form=$(type+"Form");
      form.querySelectorAll("input,select,button").forEach(el=>{
        if(el.id==="openSelfieCamera"||el.type==="submit"||el.classList.contains("camera-button")||el.type==="file"||el.tagName==="SELECT"||el.tagName==="INPUT") el.disabled=!!blocked;
      });
      const submit=$(type==="identity"?"submitIdentityButton":"submitAddressButton");
      if(submit){submit.disabled=!!blocked;submit.textContent=row?.status==="approved"?"Verified":row?.status==="pending_review"?"Under Review":row?.status==="rejected"?"Resubmit Verification":type==="identity"?"Submit Identity Verification":"Submit Address Verification";}
    });
  }
  function renderSubmissionStatus(id,row) {
    const el=$(id);if(!el)return;
    if(!row){el.innerHTML='<div class="status-list"><span class="status-chip">Not submitted</span></div>';return;}
    const chips=row.verification_type==="identity"
      ? [["ID Front",row.front_path],["ID Back",row.back_path],["Live Selfie",row.selfie_path]]
      : [["Address Document",row.address_document_path]];
    el.innerHTML='<div class="status-list">'+chips.map(([label,path])=>'<span class="status-chip '+(path?"approved":"")+'">'+label+": "+(path?"Submitted":"Missing")+'</span>').join("")+'<span class="status-chip '+row.status+'">'+statusLabel(row.status)+'</span></div>'+(row.admin_note?'<p class="admin-note"><strong>Administrator note:</strong> '+escapeHtml(row.admin_note)+'</p>':"");
  }
  function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function showTab(tab) {
    document.querySelectorAll(".verification-tab").forEach(btn=>{const active=btn.dataset.tab===tab;btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active));});
    ["personal","identity","address"].forEach(name=>{const panel=$(name+"Panel");panel.hidden=name!==tab;panel.classList.toggle("active",name===tab);});
    window.scrollTo({top:0,behavior:"smooth"});
  }
  document.querySelectorAll(".verification-tab").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.dataset.tab)));
  document.querySelectorAll(".back-dashboard").forEach(link=>link.addEventListener("click",()=>{}));

  function validateFile(file, allowPdf=false) {
    if(!file)return "Please select a file.";
    if(file.size>MAX_BYTES)return "Maximum file size is 2 MB.";
    const allowed=allowPdf?["image/jpeg","image/png","image/webp","application/pdf"]:["image/jpeg","image/png","image/webp"];
    if(!allowed.includes(file.type))return allowPdf?"Use JPG, PNG, WEBP or PDF.":"Use JPG, PNG or WEBP images.";
    return "";
  }
  function previewFile(key,file) {
    const preview=$(key==="front"?"frontPreview":key==="back"?"backPreview":key==="address"?"addressPreview":"selfiePreview");
    if(!preview)return;
    if(key==="selfie"){
      const url=URL.createObjectURL(file);preview.innerHTML='<div class="selfie-ring"><img alt="Captured selfie preview" src="'+url+'"></div><small>Selfie captured — ready to submit</small>';
      $("selfieFeedback").textContent="Selfie captured";$("selfieFeedback").classList.add("done");return;
    }
    preview.innerHTML="";
    if(file.type==="application/pdf"){preview.innerHTML='<span class="upload-placeholder">PDF</span><strong>'+escapeHtml(file.name)+'</strong><small>Document selected · Max 2 MB</small>';return;}
    const img=document.createElement("img");img.alt=key+" document preview";img.src=URL.createObjectURL(file);preview.appendChild(img);
    const small=document.createElement("small");small.textContent=file.name+" · "+(file.size/1024).toFixed(0)+" KB";preview.appendChild(small);
    const feedbackId=key==="address"?"addressUploadFeedback":key+"Feedback";$(feedbackId).textContent="File ready to upload";$(feedbackId).classList.add("done");
  }
  function acceptFile(key,file,allowPdf=false) {
    const error=validateFile(file,allowPdf);
    if(error){feedback(key==="address"?"addressFeedback":key==="selfie"?"identityFeedback":"identityFeedback",error,"error");return false;}
    selectedFiles[key]=file;previewFile(key,file);return true;
  }
  [["frontFile","front",false],["backFile","back",false],["addressFile","address",true]].forEach(([id,key,pdf])=>{
    $(id).addEventListener("change",e=>{const file=e.target.files?.[0];if(file)acceptFile(key,file,pdf);});
  });

  async function openCamera(target) {
    cameraTarget=target;
    const modal=$("cameraModal"),video=$("cameraVideo"),stage=$("cameraStage"),guide=$("cameraGuide");
    $("cameraTitle").textContent=target==="selfie"?"Live Selfie Capture":"Capture "+(target==="front"?"ID Front":target==="back"?"ID Back":"Address Document");
    $("cameraInstruction").textContent=target==="selfie"?"Center your face inside the glowing guide and look directly at the camera.":"Place the document inside the frame and make sure all text is readable.";
    guide.classList.toggle("selfie-guide",target==="selfie");stage.classList.toggle("document-mode",target!=="selfie");
    modal.classList.add("open");modal.setAttribute("aria-hidden","false");
    try{
      cameraStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:target==="selfie"?"user":"environment"},width:{ideal:1280},height:{ideal:900}}});
      video.srcObject=cameraStream;await video.play();
    }catch(error){closeCamera();feedback(target==="address"?"addressFeedback":"identityFeedback","Camera unavailable. Allow camera access or upload a file instead.","error");}
  }
  function closeCamera() {
    if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}
    $("cameraVideo").srcObject=null;$("cameraModal").classList.remove("open");$("cameraModal").setAttribute("aria-hidden","true");cameraTarget=null;
  }
  document.querySelectorAll(".camera-button").forEach(btn=>btn.addEventListener("click",()=>openCamera(btn.dataset.camera)));
  $("openSelfieCamera").addEventListener("click",()=>openCamera("selfie"));
  $("closeCamera").addEventListener("click",closeCamera);$("cancelCamera").addEventListener("click",closeCamera);
  $("cameraModal").addEventListener("click",e=>{if(e.target===$("cameraModal"))closeCamera();});
  $("capturePhoto").addEventListener("click",()=>{
    const video=$("cameraVideo"),canvas=$("cameraCanvas");if(!video.videoWidth){feedback("identityFeedback","Camera is not ready yet.","error");return;}
    canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext("2d").drawImage(video,0,0);
    canvas.toBlob(blob=>{
      if(!blob){feedback("identityFeedback","Could not capture photo.","error");return;}
      const key=cameraTarget;const file=new File([blob],key+"-"+Date.now()+".jpg",{type:"image/jpeg"});
      acceptFile(key,file,false);closeCamera();
    },"image/jpeg",.88);
  });

  async function uploadFile(file,path) {
    const {error}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;return path;
  }
  async function saveVerification(type,values,files) {
    const prefix=user.id+"/"+type+"/"+Date.now();
    const paths={};
    for(const [key,file] of Object.entries(files)){if(file)paths[key]=await uploadFile(file,prefix+"/"+key+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_"));}
    const payload={user_id:user.id,verification_type:type,status:"pending_review",submitted_at:new Date().toISOString(),updated_at:new Date().toISOString(),...values,...(type==="identity"?{front_path:paths.front||null,back_path:paths.back||null,selfie_path:paths.selfie||null}:{address_document_path:paths.address||null})};
    const {error}=await client.from("user_verification_submissions").upsert(payload,{onConflict:"user_id,verification_type"});
    if(error)throw error;
    return payload;
  }
  $("personalForm").addEventListener("submit",async e=>{
    e.preventDefault();setButton("savePersonalButton",true,"Save Changes");feedback("personalFeedback","Saving your details...");
    const payload={user_id:user.id,full_name:$("fullName").value.trim(),date_of_birth:$("dateOfBirth").value||null,phone_number:$("phoneNumber").value.trim()||null,gender:$("gender").value||null,country:$("personalCountry").value||null,updated_at:new Date().toISOString()};
    try{
      const {error}=await client.from("user_profile_details").upsert(payload,{onConflict:"user_id"});if(error)throw error;
      const {error:metadataError}=await client.auth.updateUser({data:{full_name:payload.full_name}});
      if(metadataError)console.warn("Could not update account display name metadata:",metadataError);
      
      feedback("personalFeedback","Your personal details have been saved.","success");
    }
    catch(error){console.error(error);feedback("personalFeedback",error.message||"Could not save personal details.","error");}
    finally{setButton("savePersonalButton",false,"Save Changes");}
  });
  $("identityForm").addEventListener("submit",async e=>{
    e.preventDefault();if(identityRow?.status==="pending_review"||identityRow?.status==="approved")return;
    if(!$("idDocumentType").value||!$("idCountry").value||!selectedFiles.front||!selectedFiles.back||!selectedFiles.selfie){feedback("identityFeedback","Choose your ID type and country, then provide front, back and a live selfie.","error");return;}
    for(const key of ["front","back","selfie"]){const err=validateFile(selectedFiles[key]);if(err){feedback("identityFeedback",err,"error");return;}}
    setButton("submitIdentityButton",true,"Submit Identity Verification");feedback("identityFeedback","Uploading your documents securely...");
    try{
      identityRow=await saveVerification("identity",{document_type:$("idDocumentType").value,country:$("idCountry").value,admin_note:null},{front:selectedFiles.front,back:selectedFiles.back,selfie:selectedFiles.selfie});
      feedback("identityFeedback","Identity documents submitted. Your verification is pending review.","success");renderOverall();
    }catch(error){console.error(error);feedback("identityFeedback",error.message||"Could not submit identity verification.","error");}
    finally{setButton("submitIdentityButton",false,identityRow?.status==="pending_review"?"Under Review":"Submit Identity Verification");renderOverall();}
  });
  $("addressForm").addEventListener("submit",async e=>{
    e.preventDefault();if(addressRow?.status==="pending_review"||addressRow?.status==="approved")return;
    if(!$("addressLine").value.trim()||!$("addressCity").value.trim()||!$("addressCountry").value||!$("addressDocumentType").value||!selectedFiles.address){feedback("addressFeedback","Complete your address and upload one proof-of-address document.","error");return;}
    const err=validateFile(selectedFiles.address,true);if(err){feedback("addressFeedback",err,"error");return;}
    setButton("submitAddressButton",true,"Submit Address Verification");feedback("addressFeedback","Uploading your address document securely...");
    try{
      addressRow=await saveVerification("address",{address_document_type:$("addressDocumentType").value,address_line:$("addressLine").value.trim(),city:$("addressCity").value.trim(),region:$("addressRegion").value.trim()||null,postal_code:$("postalCode").value.trim()||null,address_country:$("addressCountry").value,admin_note:null},{address:selectedFiles.address});
      feedback("addressFeedback","Address proof submitted. Your verification is pending review.","success");renderOverall();
    }catch(error){console.error(error);feedback("addressFeedback",error.message||"Could not submit address verification.","error");}
    finally{setButton("submitAddressButton",false,addressRow?.status==="pending_review"?"Under Review":"Submit Address Verification");renderOverall();}
  });

  async function loadData() {
    const {data:sessionData,error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;
    user=sessionData?.session?.user;if(!user){window.location.replace("./login.html");return;}
    $("emailAddress").value=user.email||"";
    const initialName=user.user_metadata?.full_name||user.user_metadata?.name||user.email||"U";
    
    if (!document.querySelector(".dashboard-layout")) {
    try {
      const walletToggle=$("walletBalanceToggle"),walletMenu=$("headerWalletMenu"),balanceNode=$("availableBalanceHeader");
      let walletRows=[],selectedCurrency="USD";
      const formatMoney=(amount,currency)=>{try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(amount)||0);}catch{return (currency||"USD")+" "+(Number(amount)||0).toFixed(2);}};
      const currencyIcon=currency=>({BDT:"৳",USD:"$",USDT:"₮"})[currency]||currency;
      const renderWallet=()=>{
        const funded=walletRows.filter(row=>Number(row.available_balance)>0);
        const selected=walletRows.find(row=>row.currency===selectedCurrency)||funded[0]||walletRows.find(row=>row.currency==="USD")||{currency:"USD",available_balance:0};
        selectedCurrency=selected.currency||"USD";
        if(balanceNode)balanceNode.textContent=formatMoney(selected.available_balance,selectedCurrency);
        if(!walletMenu)return;
        walletMenu.innerHTML=funded.length?funded.map(row=>'<button type="button" class="wallet-currency-option'+(row.currency===selectedCurrency?' active':'')+'" data-profile-wallet="'+String(row.currency).replace(/[^A-Z0-9]/gi,'')+'"><span class="wallet-currency-option-icon">'+currencyIcon(row.currency)+'</span><span class="wallet-currency-option-name">'+row.currency+'</span><strong>'+formatMoney(row.available_balance,row.currency)+'</strong></button>').join(""):'<p class="profile-wallet-empty">No funded wallets available</p>';
        walletMenu.querySelectorAll("[data-profile-wallet]").forEach(option=>option.addEventListener("click",()=>{const row=funded.find(item=>String(item.currency).replace(/[^A-Z0-9]/gi,'')===option.dataset.profileWallet);if(row){selectedCurrency=row.currency;renderWallet()}walletMenu.classList.remove("show");walletToggle?.setAttribute("aria-expanded","false")}));
      };
      const refreshWallet=async()=>{const {data,error}=await client.from("wallets").select("id,user_id,currency,available_balance,held_balance,updated_at").eq("user_id",user.id).order("currency",{ascending:true});if(error)throw error;walletRows=data||[];if(!walletRows.some(row=>row.currency===selectedCurrency))selectedCurrency=walletRows.find(row=>Number(row.available_balance)>0)?.currency||"USD";renderWallet()};
      await refreshWallet();
      walletToggle?.addEventListener("click",event=>{event.stopPropagation();const open=walletMenu.classList.contains("show");walletMenu.classList.toggle("show",!open);walletToggle.setAttribute("aria-expanded",String(!open))});
      document.addEventListener("click",event=>{if(!event.target.closest(".wallet-balance-dropdown")){walletMenu?.classList.remove("show");walletToggle?.setAttribute("aria-expanded","false")}});
      client.channel("profile-header-wallet-"+user.id).on("postgres_changes",{event:"*",schema:"public",table:"wallets",filter:"user_id=eq."+user.id},()=>refreshWallet().catch(error=>console.error("Wallet refresh failed:",error))).subscribe();
    } catch(walletError) { console.warn("Could not load profile header wallet:",walletError); const balanceNode=$("availableBalanceHeader");if(balanceNode)balanceNode.textContent="—"; }
    }


    const [{data:profile,error:profileError},{data:rows,error:rowsError}]=await Promise.all([
      client.from("user_profile_details").select("*").eq("user_id",user.id).maybeSingle(),
      client.from("user_verification_submissions").select("*").eq("user_id",user.id)
    ]);
    if(profileError)throw profileError;if(rowsError)throw rowsError;
    const details=profile||{};
    $("fullName").value=details.full_name||user.user_metadata?.full_name||user.user_metadata?.name||"";
    $("dateOfBirth").value=details.date_of_birth||"";
    $("phoneNumber").value=details.phone_number||"";
    $("gender").value=details.gender||"";
    $("personalCountry").value=details.country||"";
    
    identityRow=rows?.find(row=>row.verification_type==="identity")||null;
    addressRow=rows?.find(row=>row.verification_type==="address")||null;
    if(identityRow){$("idDocumentType").value=identityRow.document_type||"";$("idCountry").value=identityRow.country||"";}
    if(addressRow){$("addressLine").value=addressRow.address_line||"";$("addressCity").value=addressRow.city||"";$("addressRegion").value=addressRow.region||"";$("postalCode").value=addressRow.postal_code||"";$("addressCountry").value=addressRow.address_country||"";$("addressDocumentType").value=addressRow.address_document_type||"";}
    renderOverall();
  }
  try{await loadData();}catch(error){console.error("Profile initialization failed:",error);feedback("personalFeedback",error.message||"Could not load your profile. Check the profile verification database migration.","error");}
  client.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"||!session)window.location.replace("./login.html");});
});
