document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://eboagroxkgpplccufpuk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";
  const authStorage = {
    getItem(key){return localStorage.getItem(key) ?? sessionStorage.getItem(key)},
    setItem(key,value){if(localStorage.getItem(key)!==null)localStorage.setItem(key,value);else sessionStorage.setItem(key,value)},
    removeItem(key){localStorage.removeItem(key);sessionStorage.removeItem(key)}
  };
  const client = window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{storage:authStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
  const {data,error}=await client.auth.getSession();
  if(error||!data.session){window.location.replace("./login.html");return}
  let user=data.session.user;

  async function loadSharedHeader(){
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError||!sessionData.session){window.location.replace("./login.html");return}
    const user=sessionData.session.user;
    const name=user.user_metadata?.full_name||user.user_metadata?.name||user.email||"U";
    document.getElementById("topbarAvatar").textContent=name.trim().charAt(0).toUpperCase()||"U";
    const toggle=document.getElementById("profileWalletToggle"),menu=document.getElementById("profileWalletMenu"),balance=document.getElementById("profileAvailableBalance");
    try{
      const {data:wallets,error}=await client.from("wallets").select("currency,available_balance").eq("user_id",user.id).order("currency",{ascending:true});
      if(error)throw error;
      const rows=wallets||[],funded=rows.filter(row=>Number(row.available_balance)>0);
      let selected=funded.find(row=>row.currency==="USD")||funded[0]||rows.find(row=>row.currency==="USD")||rows[0]||{currency:"USD",available_balance:0};
      const money=(amount,currency)=>{try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(amount)||0)}catch{return (currency||"USD")+" "+(Number(amount)||0).toFixed(2)}};
      const symbols={BDT:"৳",USD:"$",USDT:"₮"};
      const render=()=>{balance.textContent=money(selected.available_balance,selected.currency);menu.innerHTML=funded.length?funded.map(row=>'<button type="button" class="wallet-currency-option'+(row.currency===selected.currency?' active':'')+'" data-currency="'+String(row.currency).replace(/[^A-Z0-9]/gi,'')+'"><span class="wallet-currency-option-icon">'+(symbols[row.currency]||row.currency)+'</span><span class="wallet-currency-option-name">'+row.currency+'</span><strong>'+money(row.available_balance,row.currency)+'</strong></button>').join(""):'<p class="profile-wallet-empty">No funded wallets available</p>';menu.querySelectorAll("[data-currency]").forEach(button=>button.addEventListener("click",()=>{selected=funded.find(row=>String(row.currency).replace(/[^A-Z0-9]/gi,'')===button.dataset.currency)||selected;render();menu.classList.remove("show");toggle.setAttribute("aria-expanded","false")}))};
      toggle.addEventListener("click",event=>{event.stopPropagation();const open=menu.classList.contains("show");menu.classList.toggle("show",!open);toggle.setAttribute("aria-expanded",String(!open))});
      document.addEventListener("click",event=>{if(!event.target.closest(".profile-header-wallet-dropdown")){menu.classList.remove("show");toggle.setAttribute("aria-expanded","false")}});
      render();
    }catch(error){console.warn("Header wallet could not load:",error);balance.textContent="—"}
  }
  await loadSharedHeader();

  const accountMessage=document.getElementById("accountMessage");
  const securityMessage=document.getElementById("securityMessage");
  const emailInput=document.getElementById("accountEmail");
  const emailForm=document.getElementById("emailForm");
  const newEmailInput=document.getElementById("newEmailAddress");
  const emailOtp=document.getElementById("emailOtp");
  const emailOtpArea=document.getElementById("emailOtpArea");
  const sendEmailCode=document.getElementById("sendEmailCode");
  const saveEmailChange=document.getElementById("saveEmailChange");
  const showEmailChange=document.getElementById("showEmailChange");
  const cancelEmailChange=document.getElementById("cancelEmailChange");
  let pendingEmail="";

  emailInput.value=user.email||"";
  const showMessage=(element,message,isError=false)=>{
    element.textContent=message;
    element.className="settings-message"+(isError?" error":"");
  };

  showEmailChange.addEventListener("click",()=>{
    emailForm.hidden=false;
    showEmailChange.hidden=true;
    newEmailInput.focus();
    showMessage(accountMessage,"");
  });
  cancelEmailChange.addEventListener("click",()=>{
    emailForm.reset();
    emailForm.hidden=true;
    emailOtpArea.hidden=true;
    sendEmailCode.disabled=false;
    sendEmailCode.textContent="Send Code";
    pendingEmail="";
    showEmailChange.hidden=false;
    showMessage(accountMessage,"");
  });

  sendEmailCode.addEventListener("click",async()=>{
    const nextEmail=newEmailInput.value.trim().toLowerCase();
    showMessage(accountMessage,"");
    if(!nextEmail||!newEmailInput.checkValidity()){
      showMessage(accountMessage,"Please enter a valid new email address.",true);return;
    }
    if(nextEmail===String(user.email||"").toLowerCase()){
      showMessage(accountMessage,"Please enter an email address different from your current one.",true);return;
    }
    sendEmailCode.disabled=true;
    sendEmailCode.textContent="Sending...";
    const result=await client.auth.updateUser({email:nextEmail});
    sendEmailCode.disabled=false;
    sendEmailCode.textContent="Send Code";
    if(result.error){showMessage(accountMessage,result.error.message,true);return}
    pendingEmail=nextEmail;
    emailOtpArea.hidden=false;
    emailOtp.focus();
    showMessage(accountMessage,"Verification code sent. Check your new email address.");
  });

  emailForm.addEventListener("submit",async event=>{
    event.preventDefault();
    const token=emailOtp.value.trim();
    if(!pendingEmail){showMessage(accountMessage,"Please send a verification code first.",true);return}
    if(!token){showMessage(accountMessage,"Please enter the verification code.",true);return}
    saveEmailChange.disabled=true;
    saveEmailChange.textContent="Verifying...";
    const result=await client.auth.verifyOtp({email:pendingEmail,token,type:"email_change"});
    saveEmailChange.disabled=false;
    saveEmailChange.textContent="Save";
    if(result.error){showMessage(accountMessage,"Verification failed: "+result.error.message,true);return}
    user=result.data.user||user;
    emailInput.value=user.email||pendingEmail;
    emailForm.reset();
    emailForm.hidden=true;
    emailOtpArea.hidden=true;
    showEmailChange.hidden=false;
    pendingEmail="";
    showMessage(accountMessage,"Your email address has been changed successfully.");
  });

  const prefs={news_updates:true,payment_received:true,payment_receipts:true,deposit_updates:true,withdrawal_updates:true,job_updates:true,submission_updates:true,job_status_updates:true,security_alerts:true,...(user.user_metadata?.notification_preferences||{})};
  document.querySelectorAll("[data-notification-pref]").forEach(input=>{
    const key=input.dataset.notificationPref;
    input.checked=prefs[key]!==false;
    input.addEventListener("change",async()=>{
      const previous=input.checked;
      const next={...prefs,[key]:previous};
      input.disabled=true;
      const result=await client.auth.updateUser({data:{notification_preferences:next}});
      input.disabled=false;
      const message=document.getElementById("notificationMessage");
      if(result.error){input.checked=!previous;showMessage(message,result.error.message,true);return}
      Object.assign(prefs,next);
      showMessage(message,"Notification preference saved.");
    });
  });

  document.querySelectorAll("[data-settings-tab]").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll("[data-settings-tab]").forEach(item=>item.classList.toggle("active",item===button));
    document.querySelectorAll("[data-settings-panel]").forEach(panel=>panel.classList.toggle("active",panel.dataset.settingsPanel===button.dataset.settingsTab));
  }));

  document.getElementById("passwordForm").addEventListener("submit",async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const currentPassword=document.getElementById("currentPassword").value;
    const password=document.getElementById("newPassword").value;
    const confirm=document.getElementById("confirmPassword").value;
    showMessage(securityMessage,"");
    if(password.length<8){showMessage(securityMessage,"New password must be at least 8 characters.",true);return}
    if(password!==confirm){showMessage(securityMessage,"The new passwords do not match.",true);return}
    if(password===currentPassword){showMessage(securityMessage,"Your new password must be different from your current password.",true);return}
    const submit=form.querySelector('button[type="submit"]');
    submit.disabled=true;
    submit.textContent="Verifying...";
    try{
      const verification=await client.auth.signInWithPassword({email:user.email,password:currentPassword});
      if(verification.error){showMessage(securityMessage,"Current password is incorrect. Password was not changed.",true);return}
      submit.textContent="Updating...";
      const update=await client.auth.updateUser({password});
      if(update.error){showMessage(securityMessage,update.error.message,true);return}
      form.reset();
      showMessage(securityMessage,"Password updated successfully.");
    }catch(err){
      showMessage(securityMessage,err.message||"Unable to update password. Please try again.",true);
    }finally{
      submit.disabled=false;
      submit.textContent="Update Password";
    }
  });
});