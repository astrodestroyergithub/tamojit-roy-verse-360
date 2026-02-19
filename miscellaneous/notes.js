const files=["SCRIPT.txt","VERSE 360 WEBSITE PROMPTS.txt","SCRIPT OF DHURANDHAR.txt","PROMPTS FOR MAKING AI CHAT SECTION.txt","CRYPTOCURRENCY.txt","ARIJIT SINGH.txt"];

async function load(){
 const container=document.getElementById("notes");

 for(const f of files){

  const t = await fetch(`notes/${f}`).then(r=>r.text());

  const div = document.createElement("div");
  container.appendChild(div);

  div.textContent = t;

  const title=document.createElement("h3");
  title.textContent=f;
  container.appendChild(title);

  // div.innerHTML = '<span class="cursor"></span>';

  // const cursor = div.querySelector(".cursor");

  // let i = 0;

  /* 
  const inter = setInterval(()=>{

      const char = t[i++] || "";

      cursor.insertAdjacentText("beforebegin", char);

      if(i >= t.length) clearInterval(inter);

  },10);
  */
 }
}
load();
