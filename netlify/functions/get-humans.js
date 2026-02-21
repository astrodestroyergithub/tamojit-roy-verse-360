const {Pool}=require("pg");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});

exports.handler=async(event)=>{

 const page=parseInt(event.queryStringParameters.page||0);
 const q=event.queryStringParameters.q;
 const limit=50;
 const offset=page*limit;

 let rows,count;

 if(q){

  const like=`%${q}%`;

  const where=`
  first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR
  phone ILIKE $1 OR city ILIKE $1 OR country ILIKE $1 OR occupation ILIKE $1
  `;

  const data=await pool.query(
   `SELECT * FROM humans WHERE ${where} ORDER BY id DESC LIMIT $2 OFFSET $3`,
   [like,limit,offset]
  );

  const c=await pool.query(`SELECT count(*) FROM humans WHERE ${where}`,[like]);

  rows=data.rows;
  count=parseInt(c.rows[0].count);

 }else{

  const data=await pool.query(
   `SELECT * FROM humans ORDER BY id DESC LIMIT $1 OFFSET $2`,
   [limit,offset]
  );

  const c=await pool.query(`SELECT count(*) FROM humans`);

  rows=data.rows;
  count=parseInt(c.rows[0].count);
 }

 return {statusCode:200,body:JSON.stringify({rows,count})};
};
