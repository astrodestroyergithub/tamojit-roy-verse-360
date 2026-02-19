document.getElementById("humanForm").addEventListener("submit", async e=>{
 e.preventDefault();

 const data = Object.fromEntries(new FormData(e.target));

 await fetch("/.netlify/functions/add-human",{
  method:"POST",
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify(data)
 });

 alert("Added!");
});
