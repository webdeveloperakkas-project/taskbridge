
document.addEventListener("DOMContentLoaded",async()=>{
  function initializeAccountMenu() {
    const profileToggle = document.getElementById("profileToggle");
    const profileMenu = document.getElementById("profileMenu");
    const notificationToggle = document.getElementById("notificationToggle");
    const notificationMenu = document.getElementById("notificationMenu");
    const closeMenus = () => {
      profileMenu?.classList.remove("show");
      notificationMenu?.classList.remove("show");
      profileToggle?.setAttribute("aria-expanded", "false");
      notificationToggle?.setAttribute("aria-expanded", "false");
    };
    profileToggle?.addEventListener("click", event => {
      event.stopPropagation();
      const opening = !profileMenu.classList.contains("show");
      closeMenus();
      if (opening) {
        profileMenu.classList.add("show");
        profileToggle.setAttribute("aria-expanded", "true");
      }
    });
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
      if (!event.target.closest(".profile-dropdown") && !event.target.closest(".notification-dropdown")) closeMenus();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenus(); });
    const currentPage = window.location.pathname.split("/").pop();
    profileMenu?.querySelectorAll("a").forEach(link => {
      if (new URL(link.href, window.location.href).pathname.split("/").pop() === currentPage) link.setAttribute("aria-current", "page");
    });
  }

  initializeAccountMenu();
  const SUPABASE_URL="https://eboagroxkgpplccufpuk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY="sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";
  const storage={getItem:key=>localStorage.getItem(key)??sessionStorage.getItem(key),setItem:(key,value)=>{if(localStorage.getItem(key)!==null)localStorage.setItem(key,value);else sessionStorage.setItem(key,value)},removeItem:key=>{localStorage.removeItem(key);sessionStorage.removeItem(key)}};
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{storage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
  const {data,error}=await client.auth.getSession();
  if(error||!data.session){window.location.replace("./login.html");return}
  const user=data.session.user,name=user.user_metadata?.full_name||user.user_metadata?.name||user.email||"U";
  
  const nameInput=document.getElementById("supportName"),emailInput=document.getElementById("supportEmail");
  nameInput.value=user.user_metadata?.full_name||user.user_metadata?.name||"";
  emailInput.value=user.email||"";
  const toggle=document.getElementById("walletBalanceToggle"),menu=document.getElementById("headerWalletMenu"),balance=document.getElementById("availableBalanceHeader");
  try{
    const {data:wallets,error}=await client.from("wallets").select("currency,available_balance").eq("user_id",user.id).order("currency",{ascending:true});if(error)throw error;
    const rows=wallets||[],funded=rows.filter(row=>Number(row.available_balance)>0);let selected=funded.find(row=>row.currency==="USD")||funded[0]||rows.find(row=>row.currency==="USD")||rows[0]||{currency:"USD",available_balance:0};
    const money=(amount,currency)=>{try{return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(amount)||0)}catch{return (currency||"USD")+" "+(Number(amount)||0).toFixed(2)}},symbols={BDT:"৳",USD:"$",USDT:"₮"};
    const render=()=>{balance.textContent=money(selected.available_balance,selected.currency);menu.innerHTML=funded.length?funded.map(row=>'<button type="button" class="wallet-currency-option'+(row.currency===selected.currency?' active':'')+'" data-currency="'+String(row.currency).replace(/[^A-Z0-9]/gi,'')+'"><span class="wallet-currency-option-icon">'+(symbols[row.currency]||row.currency)+'</span><span class="wallet-currency-option-name">'+row.currency+'</span><strong>'+money(row.available_balance,row.currency)+'</strong></button>').join(""):'<p class="profile-wallet-empty">No funded wallets available</p>';menu.querySelectorAll("[data-currency]").forEach(button=>button.addEventListener("click",()=>{selected=funded.find(row=>String(row.currency).replace(/[^A-Z0-9]/gi,'')===button.dataset.currency)||selected;render();menu.classList.remove("show");toggle.setAttribute("aria-expanded","false")}))};
    toggle.addEventListener("click",event=>{event.stopPropagation();const open=menu.classList.contains("show");menu.classList.toggle("show",!open);toggle.setAttribute("aria-expanded",String(!open))});
    document.addEventListener("click",event=>{if(!event.target.closest(".profile-header-wallet-dropdown")){menu.classList.remove("show");toggle.setAttribute("aria-expanded","false")}});
    render();
  }catch(err){console.warn("Header wallet could not load:",err);balance.textContent="—"}

  const form=document.getElementById("supportMessageForm"),send=document.getElementById("supportSendButton"),status=document.getElementById("supportFormStatus");
  form.addEventListener("submit",async event=>{
    event.preventDefault();status.textContent="";status.className="support-form-status";
    const payload={name:nameInput.value.trim(),email:emailInput.value.trim(),subject:document.getElementById("supportSubject").value.trim(),message:document.getElementById("supportMessage").value.trim()};
    if(!payload.name||!payload.email||!payload.subject||!payload.message){status.textContent="Please complete all fields.";status.classList.add("error");return}
    send.disabled=true;send.querySelector("span").textContent="Sending...";
    try{
      const {data:result,error:sendError}=await client.functions.invoke("send-support-message",{body:payload});
      if(sendError)throw sendError;
      if(result?.error)throw new Error(result.error);
      form.reset();nameInput.value=user.user_metadata?.full_name||user.user_metadata?.name||"";emailInput.value=user.email||"";
      status.textContent="Your message has been sent to TaskBridge Support. Thank you!";status.classList.add("success");
    }catch(err){console.error("Support message failed:",err);status.textContent=err.message||"Could not send your message. Please try again later.";status.classList.add("error")}
    finally{send.disabled=false;send.querySelector("span").textContent="Send Message"}
  });
});
