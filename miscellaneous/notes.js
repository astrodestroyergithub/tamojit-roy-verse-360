const files=["note1.txt","note2.txt"];

async function load(){
 const container=document.getElementById("notes");

 for(const f of files){
  const t=await fetch(`notes/${f}`).then(r=>r.text());

  const div=document.createElement("div");
  container.appendChild(div);

  let i=0;
  const inter=setInterval(()=>{
   div.textContent+=t[i++]||"";
   if(i>=t.length)clearInterval(inter);
  },10);
 }
}
load();
