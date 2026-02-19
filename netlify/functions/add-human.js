const {Pool}=require("pg");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});

exports.handler=async(event)=>{
 const data=JSON.parse(event.body);

 const cols=Object.keys(data);
 const vals=Object.values(data);

 const q=`INSERT INTO humans(${cols.join(",")})
          VALUES(${cols.map((_,i)=>`$${i+1}`).join(",")})`;

 await pool.query(q,vals);

 return {statusCode:200,body:"ok"};
};
