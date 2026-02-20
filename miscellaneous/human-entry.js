document.getElementById("humanForm").addEventListener("submit", async e=>{
    e.preventDefault();

    /* ===== Collect form data ===== */
    const raw = Object.fromEntries(new FormData(e.target));

    /* ⭐ Remove empty values */
    const data = {};

    Object.entries(raw).forEach(([k,v])=>{
        if(v !== null && v !== undefined && v.trim() !== ""){
            data[k] = v.trim();
        }
    });

    /* ⭐ Only require first & last name */
    if(!data.first_name || !data.last_name){
        alert("First and Last name required");
        return;
    }

    await fetch("/.netlify/functions/add-human",{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    });

    alert("Added!");
    e.target.reset();
});
