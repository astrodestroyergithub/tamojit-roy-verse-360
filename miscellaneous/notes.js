const files=[
 "SCRIPT.txt",
 "VERSE 360 WEBSITE PROMPTS.txt",
 "SCRIPT OF DHURANDHAR.txt",
 "PROMPTS FOR MAKING AI CHAT SECTION.txt",
 "CRYPTOCURRENCY.txt",
 "ARIJIT SINGH.txt"
];

async function load(){

 const container=document.getElementById("notes");

 for(const f of files){

  const t = await fetch(`notes/${f}`).then(r=>r.text());

  const title=document.createElement("h3");
  title.textContent=f;
  container.appendChild(title);

  const div=document.createElement("div");
  container.appendChild(div);

  div.textContent=t;
 }
}

load();
