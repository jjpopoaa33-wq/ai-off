const messagesEl=document.getElementById("messages");
const welcome=document.getElementById("welcome");
const form=document.getElementById("chatForm");
const input=document.getElementById("messageInput");
const sendBtn=document.getElementById("sendBtn");
const toast=document.getElementById("toast");
const sidebar=document.getElementById("sidebar");
let history=[];
let busy=false;

function notify(text){toast.textContent=text;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2600)}
function addMessage(role,text,save=true){
  welcome.style.display="none";
  const wrap=document.createElement("div");wrap.className=`message ${role==="user"?"user":"assistant"}`;
  const avatar=document.createElement("div");avatar.className="message-avatar";avatar.textContent=role==="user"?"คุณ":"อ็อฟ";
  const bubble=document.createElement("div");bubble.className="bubble";bubble.textContent=text;
  wrap.append(avatar,bubble);messagesEl.append(wrap);
  if(save)history.push({role,content:text});
  document.getElementById("chatArea").scrollTop=document.getElementById("chatArea").scrollHeight;
  return bubble;
}
function resetChat(){history=[];messagesEl.innerHTML="";welcome.style.display="block";input.focus()}
async function sendMessage(text){
  if(!text.trim()||busy)return;
  busy=true;sendBtn.disabled=true;input.value="";input.style.height="auto";
  addMessage("user",text);
  const pending=addMessage("model","กำลังคิดคำตอบ…",false);pending.classList.add("typing");
  try{
    const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"ส่งข้อความไม่สำเร็จ");
    pending.textContent=data.answer;pending.classList.remove("typing");
    history.push({role:"model",content:data.answer});
  }catch(error){pending.textContent="ขอโทษครับ เกิดปัญหา: "+error.message;pending.classList.remove("typing");}
  busy=false;sendBtn.disabled=false;input.focus();
}
form.addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value)});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px"});
document.querySelectorAll(".suggestion").forEach(btn=>btn.addEventListener("click",()=>sendMessage(btn.textContent.replace(/^\\S+\\s/,""))));
document.getElementById("newChat").addEventListener("click",()=>{resetChat();sidebar.classList.remove("open")});
document.getElementById("clearBtn").addEventListener("click",()=>{resetChat();notify("เริ่มแชตใหม่แล้วครับ")});
document.getElementById("homeBtn").addEventListener("click",resetChat);
document.getElementById("menuBtn").addEventListener("click",()=>sidebar.classList.toggle("open"));
