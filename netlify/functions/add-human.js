const {Pool}=require("pg");

const pool=new Pool({
    connectionString:process.env.DATABASE_URL,
    ssl:{rejectUnauthorized:false}
});

exports.handler=async(event)=>{

    try{

        let data = JSON.parse(event.body);

        /* ⭐ Backend safety filter */
        const filtered = {};

        Object.entries(data).forEach(([k,v])=>{
            if(v !== null && v !== undefined && String(v).trim() !== ""){
                filtered[k] = v;
            }
        });

        /* ⭐ Ensure minimal fields */
        if(!filtered.first_name || !filtered.last_name){
            return {statusCode:400, body:"first/last required"};
        }

        const cols = Object.keys(filtered);
        const vals = Object.values(filtered);

        const q = `
            INSERT INTO humans(${cols.join(",")})
            VALUES(${cols.map((_,i)=>`$${i+1}`).join(",")})
        `;

        await pool.query(q,vals);

        return {statusCode:200,body:"ok"};

    }catch(err){
        console.error(err);
        return {statusCode:500, body:"error"};
    }
};
