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
  const user=data.session.user;
  const emailInput=document.getElementById("accountEmail");
  emailInput.value=user.email||"";
  const prefs={news_updates:true,payment_received:true,payment_receipts:true,deposit_updates:true,withdrawal_updates:true,job_updates:true,submission_updates:true,job_status_updates:true,security_alerts:true,...(user.user_metadata?.notification_preferences||{})};
  document.querySelectorAll("[data-notification-pref]").forEach(input=>{
    const key=input.dataset.notificationPref;
    input.checked=prefs[key]!==false;
    input.addEventListener("change",async()=>{
      const next={...prefs,[key]:input.checked};
      input.disabled=true;
      const result=await client.auth.updateUser({data:{notification_preferences:next}});
      input.disabled=false;
      const message=document.getElementById("notificationMessage");
      if(result.error){input.checked=!input.checked;message.textContent=result.error.message;message.classList.add("error");return}
      Object.assign(prefs,next);message.textContent="Notification preference saved.";message.classList.remove("error");
    });
  });
  document.querySelectorAll("[data-settings-tab]").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll("[data-settings-tab]").forEach(item=>item.classList.toggle("active",item===button));
    document.querySelectorAll("[data-settings-panel]").forEach(panel=>panel.classList.toggle("active",panel.dataset.settingsPanel===button.dataset.settingsTab));
  }));
  document.getElementById("emailForm").addEventListener("submit",async event=>{
    event.preventDefault();const message=document.getElementById("accountMessage");message.className="settings-message";
    const nextEmail=emailInput.value.trim();if(!nextEmail)return;
    const result=await client.auth.updateUser({email:nextEmail});
    message.textContent=result.error?result.error.message:"Email update requested. Check your inbox to confirm the new address.";
    if(result.error)message.classList.add("error");
  });
  document.getElementById("passwordForm").addEventListener("submit",async event=>{
    event.preventDefault();const message=document.getElementById("securityMessage");message.className="settings-message";
    const password=document.getElementById("newPassword").value;
    const confirm=document.getElementById("confirmPassword").value;
    if(password!==confirm){message.textContent="The passwords do not match.";message.classList.add("error");return}
    const result=await client.auth.updateUser({password});
    message.textContent=result.error?result.error.message:"Password updated successfully.";
    if(result.error)message.classList.add("error");
    else event.target.reset();
  });
});