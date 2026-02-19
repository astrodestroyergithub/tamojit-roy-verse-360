const {Pool}=require("pg");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});

exports.handler=async(event)=>{
 const page=event.queryStringParameters.page||0;
 const limit=50;

 const r=await pool.query(
  `SELECT * FROM humans ORDER BY id DESC LIMIT $1 OFFSET $2`,
  [limit,page*limit]
 );

 return {statusCode:200,body:JSON.stringify(r.rows)};
};
