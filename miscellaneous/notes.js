const files=["note1.txt","note2.txt"];

async function load(){
 const container=document.getElementById("notes");

 for(const f of files){

  const t = await fetch(`notes/${f}`).then(r=>r.text());

  const div = document.createElement("div");
  container.appendChild(div);

  /* ⭐ ADD CURSOR HERE */
  div.innerHTML = '<span class="cursor"></span>';

  const cursor = div.querySelector(".cursor");

  let i = 0;

  const inter = setInterval(()=>{

      const char = t[i++] || "";

      /* insert text BEFORE cursor */
      cursor.insertAdjacentText("beforebegin", char);

      if(i >= t.length) clearInterval(inter);

  },10);
 }
}
load();
